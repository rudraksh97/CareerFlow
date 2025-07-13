import os
import json
import base64
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Tuple
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import dateutil.parser

class GoogleAPIService:
    """Service for integrating with Gmail and Google Calendar APIs"""
    
    # OAuth 2.0 scopes for Gmail and Calendar
    SCOPES = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
    ]
    
    def __init__(self, credentials_path: str = None, token_path: str = None):
        """
        Initialize Google API service
        
        Args:
            credentials_path: Path to OAuth2 credentials JSON file
            token_path: Path to store/load OAuth2 tokens
        """
        self.credentials_path = credentials_path or os.getenv('GOOGLE_CREDENTIALS_PATH', 'credentials.json')
        self.token_path = token_path or os.getenv('GOOGLE_TOKEN_PATH', 'token.json')
        self.creds = None
        self.gmail_service = None
        self.calendar_service = None
        self.client_id = os.environ.get("GOOGLE_CLIENT_ID")
        self.client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        self.redirect_uri = os.environ.get("GOOGLE_OAUTH_REDIRECT_URI")
        
    def authenticate(self) -> bool:
        """
        Authenticate with Google APIs using OAuth2
        
        Returns:
            bool: True if authentication successful, False otherwise
        """
        try:
            # Load existing token if available
            if os.path.exists(self.token_path):
                self.creds = Credentials.from_authorized_user_file(self.token_path, self.SCOPES)
            
            # If there are no (valid) credentials available, prompt user to log in
            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    self.creds.refresh(Request())
                else:
                    # For OAuth flow, we don't need credentials.json
                    # The tokens should be available in token.json from the OAuth callback
                    if not os.path.exists(self.token_path):
                        raise FileNotFoundError(f"Google token file not found: {self.token_path}. Please complete OAuth flow first.")
                    
                    # If we reach here, token exists but is invalid and no refresh token
                    raise Exception("Invalid token and no refresh token available. Please re-authenticate.")
                
                # Save the refreshed credentials
                with open(self.token_path, 'w') as token:
                    token.write(self.creds.to_json())
            
            # Build services
            self.gmail_service = build('gmail', 'v1', credentials=self.creds)
            self.calendar_service = build('calendar', 'v3', credentials=self.creds)
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Google API authentication failed: {str(e)}")
            return False
    
    def test_connection(self) -> Dict[str, bool]:
        """
        Test connection to both Gmail and Calendar APIs
        
        Returns:
            Dict with connection status for each service
        """
        result = {'gmail': False, 'calendar': False}
        
        try:
            if self.gmail_service:
                # Test Gmail connection
                profile = self.gmail_service.users().getProfile(userId='me').execute()
                result['gmail'] = True
                print(f"[DEBUG] Gmail connected for: {profile.get('emailAddress')}")
                
            if self.calendar_service:
                # Test Calendar connection
                calendar_list = self.calendar_service.calendarList().list(maxResults=1).execute()
                result['calendar'] = True
                print(f"[DEBUG] Calendar connected, found {len(calendar_list.get('items', []))} calendars")
                
        except Exception as e:
            print(f"[ERROR] Connection test failed: {str(e)}")
            
        return result
    
    def get_emails(self, 
                   query: str = '', 
                   max_results: int = 100, 
                   page_token: str = None,
                   include_spam_trash: bool = False) -> Dict[str, Any]:
        """
        Fetch emails from Gmail
        
        Args:
            query: Gmail search query (e.g., 'is:unread', 'from:recruiter@company.com')
            max_results: Maximum number of emails to fetch
            page_token: Token for pagination
            include_spam_trash: Include spam and trash emails
            
        Returns:
            Dict containing emails and pagination info
        """
        if not self.gmail_service:
            raise Exception("Gmail service not initialized. Call authenticate() first.")
        
        try:
            # Search for messages
            result = self.gmail_service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results,
                pageToken=page_token,
                includeSpamTrash=include_spam_trash
            ).execute()
            
            messages = result.get('messages', [])
            emails = []
            
            # Fetch full email details
            for message in messages:
                email_data = self._get_email_details(message['id'])
                if email_data:
                    emails.append(email_data)
            
            return {
                'emails': emails,
                'next_page_token': result.get('nextPageToken'),
                'result_size_estimate': result.get('resultSizeEstimate', 0)
            }
            
        except HttpError as error:
            print(f"[ERROR] Gmail API error: {error}")
            raise Exception(f"Failed to fetch emails: {error}")
    
    def _get_email_details(self, message_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information for a specific email
        
        Args:
            message_id: Gmail message ID
            
        Returns:
            Dict containing email details or None if failed
        """
        try:
            message = self.gmail_service.users().messages().get(
                userId='me', 
                id=message_id,
                format='full'
            ).execute()
            
            headers = message['payload'].get('headers', [])
            header_dict = {h['name']: h['value'] for h in headers}
            
            # Extract email body
            body_text, body_html = self._extract_email_body(message['payload'])
            
            # Fallback to snippet if body extraction failed or is mostly garbage
            if not body_text or len(body_text.strip()) < 20 or self._is_mostly_tracking_data(body_text):
                snippet = message.get('snippet', '')
                if snippet and len(snippet.strip()) > 20:
                    body_text = snippet
                    print(f"[DEBUG] Using email snippet as fallback for message {message_id}")
            
            # Parse date
            date_received = None
            if 'Date' in header_dict:
                try:
                    date_received = dateutil.parser.parse(header_dict['Date'])
                except:
                    date_received = datetime.now()
            
            return {
                'id': message['id'],
                'thread_id': message['threadId'],
                'subject': header_dict.get('Subject', ''),
                'sender_name': self._extract_name_from_email(header_dict.get('From', '')),
                'sender_email': self._extract_email_from_string(header_dict.get('From', '')),
                'recipient_email': self._extract_email_from_string(header_dict.get('To', '')),
                'body_text': body_text,
                'body_html': body_html,
                'date_received': date_received,
                'labels': message.get('labelIds', []),
                'snippet': message.get('snippet', ''),
                'size_estimate': message.get('sizeEstimate', 0)
            }
            
        except Exception as e:
            print(f"[ERROR] Failed to get email details for {message_id}: {str(e)}")
            return None
    
    def _extract_email_body(self, payload: Dict) -> Tuple[str, str]:
        """
        Extract text and HTML body from email payload
        
        Args:
            payload: Gmail message payload
            
        Returns:
            Tuple of (text_body, html_body)
        """
        text_parts = []
        html_parts = []
        
        def extract_from_part(part):
            nonlocal text_parts, html_parts
            mime_type = part.get('mimeType', '')
            
            if 'body' in part and 'data' in part['body']:
                try:
                    decoded_data = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                    
                    if mime_type == 'text/plain':
                        # Clean up the plain text
                        cleaned_text = self._clean_email_text(decoded_data)
                        if cleaned_text and len(cleaned_text.strip()) > 20:  # Only keep substantial content
                            text_parts.append(cleaned_text)
                    elif mime_type == 'text/html':
                        # Clean up HTML and convert to readable text
                        cleaned_html = self._clean_email_html(decoded_data)
                        if cleaned_html and len(cleaned_html.strip()) > 20:
                            html_parts.append(cleaned_html)
                except Exception as e:
                    print(f"[DEBUG] Failed to decode email part: {str(e)}")
                    pass
            
            # Recursively process multipart content
            if 'parts' in part:
                for subpart in part['parts']:
                    extract_from_part(subpart)
        
        extract_from_part(payload)
        
        # Join all text parts, preferring the longest/most substantial one
        text_body = ""
        if text_parts:
            # Find the longest text part that's not just tracking URLs
            best_text = ""
            for text in text_parts:
                if len(text.strip()) > len(best_text.strip()) and not self._is_mostly_tracking_data(text):
                    best_text = text
            text_body = best_text if best_text else text_parts[0]
        
        html_body = ""
        if html_parts:
            # Similar logic for HTML
            best_html = ""
            for html in html_parts:
                if len(html.strip()) > len(best_html.strip()) and not self._is_mostly_tracking_data(html):
                    best_html = html
            html_body = best_html if best_html else html_parts[0]
        
        return text_body.strip(), html_body.strip()
    
    def _clean_email_text(self, text: str) -> str:
        """Clean up email text content"""
        if not text:
            return ""
        
        # Remove excessively long tracking URLs
        text = re.sub(r'https?://[^\s]{200,}', '[Long URL removed]', text)
        
        # Clean up common tracking parameters while preserving readable URLs
        text = re.sub(r'(\?|&)(utm_[^&\s]*|tracking[^&\s]*|gclid[^&\s]*|fbclid[^&\s]*)', '', text)
        
        # Remove base64 encoded content that sometimes gets mixed in
        text = re.sub(r'[A-Za-z0-9+/]{100,}={0,2}', '[Encoded content removed]', text)
        
        # Remove excessive whitespace but preserve paragraph breaks
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        text = re.sub(r' +', ' ', text)
        
        # Remove oauth tokens and similar long strings
        text = re.sub(r'\b[A-Za-z0-9_-]{50,}\b', '[Token removed]', text)
        
        return text.strip()
    
    def _clean_email_html(self, html: str) -> str:
        """Clean up HTML content and convert to readable text"""
        if not html:
            return ""
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text content
            text = soup.get_text()
            
            # Clean up the extracted text
            return self._clean_email_text(text)
        except ImportError:
            # Fallback if BeautifulSoup not available
            # Simple HTML tag removal
            text = re.sub(r'<[^>]+>', '', html)
            return self._clean_email_text(text)
        except Exception as e:
            print(f"[DEBUG] HTML cleaning failed: {str(e)}")
            return self._clean_email_text(html)
    
    def _is_mostly_tracking_data(self, text: str) -> bool:
        """Check if text is mostly tracking URLs and tokens"""
        if not text or len(text.strip()) < 50:
            return True
        
        # Count tracking indicators
        tracking_patterns = [
            r'https?://[^\s]{100,}',  # Very long URLs
            r'\b[A-Za-z0-9_-]{40,}\b',  # Long tokens
            r'utm_\w+',  # UTM parameters
            r'tracking\w*',  # Tracking keywords
            r'gclid|fbclid',  # Google/Facebook click IDs
        ]
        
        tracking_matches = 0
        for pattern in tracking_patterns:
            tracking_matches += len(re.findall(pattern, text, re.IGNORECASE))
        
        # If more than 30% of the content is tracking-related, consider it mostly tracking
        total_chars = len(text)
        tracking_chars = sum(len(match) for pattern in tracking_patterns for match in re.findall(pattern, text))
        
        return tracking_chars > (total_chars * 0.3) or tracking_matches > 10
    
    def _extract_email_from_string(self, email_string: str) -> str:
        """Extract email address from string like 'Name <email@domain.com>'"""
        if not email_string:
            return ""
        
        # Try to extract email from angle brackets first
        match = re.search(r'<([^>]+)>', email_string)
        if match:
            return match.group(1)
        
        # If no angle brackets, assume the whole string is an email
        # Basic email validation
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, email_string)
        return match.group(0) if match else email_string
    
    def _extract_name_from_email(self, email_string: str) -> str:
        """Extract name from string like 'Name <email@domain.com>'"""
        if not email_string:
            return ""
        
        # Try to extract name before angle brackets
        match = re.search(r'^([^<]+)<', email_string)
        if match:
            return match.group(1).strip().strip('"')
        
        # If no angle brackets, return empty string
        return ""
    
    def mark_email_as_read(self, message_id: str) -> bool:
        """
        Mark email as read
        
        Args:
            message_id: Gmail message ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.gmail_service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
            return True
        except Exception as e:
            print(f"[ERROR] Failed to mark email as read: {str(e)}")
            return False
    
    def archive_email(self, message_id: str) -> bool:
        """
        Archive email (remove from inbox)
        
        Args:
            message_id: Gmail message ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.gmail_service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['INBOX']}
            ).execute()
            return True
        except Exception as e:
            print(f"[ERROR] Failed to archive email: {str(e)}")
            return False
    
    def get_calendar_events(self,
                           calendar_id: str = 'primary',
                           time_min: datetime = None,
                           time_max: datetime = None,
                           max_results: int = 100,
                           single_events: bool = True,
                           order_by: str = 'startTime') -> List[Dict[str, Any]]:
        """
        Fetch calendar events
        
        Args:
            calendar_id: Calendar ID (default: 'primary')
            time_min: Minimum start time for events
            time_max: Maximum start time for events
            max_results: Maximum number of events to fetch
            single_events: Whether to expand recurring events
            order_by: How to order results
            
        Returns:
            List of calendar events
        """
        if not self.calendar_service:
            raise Exception("Calendar service not initialized. Call authenticate() first.")
        
        try:
            # Default to events from now for the next 30 days
            if not time_min:
                time_min = datetime.utcnow()
            if not time_max:
                time_max = time_min + timedelta(days=30)
            
            # Convert to RFC3339 format
            time_min_str = time_min.isoformat() + 'Z'
            time_max_str = time_max.isoformat() + 'Z'
            
            events_result = self.calendar_service.events().list(
                calendarId=calendar_id,
                timeMin=time_min_str,
                timeMax=time_max_str,
                maxResults=max_results,
                singleEvents=single_events,
                orderBy=order_by
            ).execute()
            
            events = events_result.get('items', [])
            processed_events = []
            
            for event in events:
                processed_event = self._process_calendar_event(event, calendar_id)
                if processed_event:
                    processed_events.append(processed_event)
            
            return processed_events
            
        except HttpError as error:
            print(f"[ERROR] Calendar API error: {error}")
            raise Exception(f"Failed to fetch calendar events: {error}")
    
    def _process_calendar_event(self, event: Dict, calendar_id: str) -> Optional[Dict[str, Any]]:
        """
        Process raw calendar event data into structured format
        
        Args:
            event: Raw calendar event from Google API
            calendar_id: Calendar ID
            
        Returns:
            Processed event data or None if failed
        """
        try:
            # Extract start and end times
            start = event.get('start', {})
            end = event.get('end', {})
            
            # Handle both datetime and date (all-day events)
            start_datetime = None
            end_datetime = None
            is_all_day = False
            timezone = None
            
            if 'dateTime' in start:
                start_datetime = dateutil.parser.parse(start['dateTime'])
                end_datetime = dateutil.parser.parse(end['dateTime'])
                timezone = start.get('timeZone')
            elif 'date' in start:
                start_datetime = dateutil.parser.parse(start['date'])
                end_datetime = dateutil.parser.parse(end['date'])
                is_all_day = True
            
            # Extract organizer info
            organizer = event.get('organizer', {})
            organizer_email = organizer.get('email', '')
            organizer_name = organizer.get('displayName', '')
            
            # Extract attendees
            attendees = []
            for attendee in event.get('attendees', []):
                attendees.append({
                    'email': attendee.get('email', ''),
                    'name': attendee.get('displayName', ''),
                    'response_status': attendee.get('responseStatus', ''),
                    'optional': attendee.get('optional', False)
                })
            
            # Extract meeting links (Zoom, Meet, etc.)
            meeting_link = None
            conference_data = event.get('conferenceData', {})
            if conference_data:
                entry_points = conference_data.get('entryPoints', [])
                for entry_point in entry_points:
                    if entry_point.get('entryPointType') == 'video':
                        meeting_link = entry_point.get('uri')
                        break
            
            return {
                'id': event['id'],
                'calendar_id': calendar_id,
                'summary': event.get('summary', ''),
                'description': event.get('description', ''),
                'location': event.get('location', ''),
                'start_datetime': start_datetime,
                'end_datetime': end_datetime,
                'timezone': timezone,
                'is_all_day': is_all_day,
                'status': event.get('status', 'confirmed').upper(),
                'organizer_email': organizer_email,
                'organizer_name': organizer_name,
                'attendees': attendees,
                'meeting_link': meeting_link,
                'html_link': event.get('htmlLink', ''),
                'created': dateutil.parser.parse(event['created']) if 'created' in event else None,
                'updated': dateutil.parser.parse(event['updated']) if 'updated' in event else None
            }
            
        except Exception as e:
            print(f"[ERROR] Failed to process calendar event {event.get('id', 'unknown')}: {str(e)}")
            return None
    
    def get_calendars(self) -> List[Dict[str, Any]]:
        """
        Get list of available calendars
        
        Returns:
            List of calendar information
        """
        if not self.calendar_service:
            raise Exception("Calendar service not initialized. Call authenticate() first.")
        
        try:
            calendar_list = self.calendar_service.calendarList().list().execute()
            calendars = []
            
            for calendar in calendar_list.get('items', []):
                calendars.append({
                    'id': calendar['id'],
                    'summary': calendar.get('summary', ''),
                    'description': calendar.get('description', ''),
                    'primary': calendar.get('primary', False),
                    'access_role': calendar.get('accessRole', ''),
                    'selected': calendar.get('selected', False),
                    'background_color': calendar.get('backgroundColor', ''),
                    'foreground_color': calendar.get('foregroundColor', '')
                })
            
            return calendars
            
        except HttpError as error:
            print(f"[ERROR] Calendar list API error: {error}")
            raise Exception(f"Failed to fetch calendars: {error}")
    
    def search_hiring_related_emails(self, days_back: int = 30) -> Dict[str, Any]:
        """
        Search for hiring-related emails using common keywords, including spam folder
        
        Args:
            days_back: Number of days to search back
            
        Returns:
            Dict containing hiring-related emails from inbox and spam
        """
        # Common hiring-related keywords and patterns
        hiring_keywords = [
            "interview", "job opportunity", "position", "recruiter", "hiring",
            "application", "resume", "CV", "offer", "salary", "compensation",
            "onboarding", "background check", "reference", "screening",
            "technical assessment", "coding challenge", "take home",
            "team meeting", "culture fit", "next steps", "feedback"
        ]
        
        # Build search query
        keyword_query = " OR ".join([f'"{keyword}"' for keyword in hiring_keywords])
        date_query = f"newer_than:{days_back}d"
        full_query = f"({keyword_query}) AND {date_query}"
        
        # Search in both inbox and spam
        print(f"[INFO] Searching for hiring emails in inbox and spam for {days_back} days")
        
        # Get emails from inbox and spam
        all_emails = self.get_emails(query=full_query, max_results=200, include_spam_trash=True)
        
        # Filter out actual spam using additional validation
        filtered_emails = self._filter_legitimate_hiring_emails(all_emails.get('emails', []))
        
        return {
            'emails': filtered_emails,
            'next_page_token': all_emails.get('next_page_token'),
            'result_size_estimate': len(filtered_emails),
            'original_count': len(all_emails.get('emails', [])),
            'spam_filtered_count': len(all_emails.get('emails', [])) - len(filtered_emails)
        }
    
    def get_upcoming_events(self, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """
        Get upcoming calendar events
        
        Args:
            days_ahead: Number of days ahead to look for events
            
        Returns:
            List of upcoming events
        """
        time_min = datetime.utcnow()
        time_max = time_min + timedelta(days=days_ahead)
        
        return self.get_calendar_events(
            time_min=time_min,
            time_max=time_max,
            max_results=50
        )
    
    def _filter_legitimate_hiring_emails(self, emails: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filter out actual spam emails from the list, keeping only legitimate hiring emails
        
        Args:
            emails: List of email dictionaries
            
        Returns:
            List of legitimate hiring emails
        """
        legitimate_emails = []
        
        for email in emails:
            if self._is_legitimate_hiring_email(email):
                legitimate_emails.append(email)
            else:
                print(f"[INFO] Filtered out potential spam email: {email.get('subject', 'No subject')[:50]}...")
        
        return legitimate_emails
    
    def _is_legitimate_hiring_email(self, email: Dict[str, Any]) -> bool:
        """
        Determine if an email is a legitimate hiring email or spam
        
        Args:
            email: Email data dictionary
            
        Returns:
            bool: True if legitimate, False if spam
        """
        subject = email.get('subject', '').lower()
        body_text = email.get('body_text', '').lower()
        sender_email = email.get('sender_email', '').lower()
        sender_name = email.get('sender_name', '').lower()
        
        # Red flags that indicate spam
        spam_indicators = [
            # Generic spam phrases
            'make money fast', 'easy money', 'get rich quick', 'work from home scam',
            'no experience required', 'earn $', 'guaranteed income', 'click here now',
            'limited time offer', 'act now', 'urgent response required',
            
            # Suspicious hiring claims
            'high paying job with no experience', 'earn thousands weekly',
            'mysterious shopper', 'envelope stuffing', 'data entry from home',
            
            # Generic/suspicious senders
            'noreply@', 'donotreply@', 'automated@',
            
            # Suspicious links/attachments
            'download this software', 'install this app', 'verify your account',
            'update your information', 'confirm your identity'
        ]
        
        # Check for spam indicators
        content = f"{subject} {body_text} {sender_email} {sender_name}"
        spam_score = sum(1 for indicator in spam_indicators if indicator in content)
        
        # Legitimate hiring email indicators
        legitimate_indicators = [
            # Professional language
            'dear', 'sincerely', 'best regards', 'thank you for your time',
            'we reviewed your application', 'would like to schedule',
            'interview process', 'next steps', 'team member',
            
            # Company-specific domains (not free email providers for professional outreach)
            '.com', '.org', '.net', '.edu', '.gov',
            
            # Specific role mentions
            'software engineer', 'developer', 'manager', 'analyst', 'coordinator',
            'specialist', 'consultant', 'director', 'lead', 'senior', 'junior',
            
            # Legitimate recruiting platforms
            'linkedin', 'indeed', 'glassdoor', 'hired.com', 'angellist'
        ]
        
        legitimacy_score = sum(1 for indicator in legitimate_indicators if indicator in content)
        
        # Check sender domain authenticity
        domain_legitimacy = self._check_sender_domain_legitimacy(sender_email)
        
        # Check email structure and formatting
        structure_score = self._check_email_structure(email)
        
        # Calculate overall legitimacy score
        # Higher spam score reduces legitimacy
        # Higher legitimacy score increases legitimacy
        # Domain legitimacy is weighted heavily
        # Structure score also contributes
        
        total_score = (legitimacy_score * 2) + domain_legitimacy + structure_score - (spam_score * 3)
        
        # Email is legitimate if it has a positive score and meets minimum criteria
        is_legitimate = (
            total_score > 2 and  # Minimum overall score
            spam_score < 2 and   # Maximum spam indicators
            legitimacy_score > 0  # Must have at least one legitimate indicator
        )
        
        if not is_legitimate:
            print(f"[DEBUG] Email filtered as spam - Score: {total_score}, Spam: {spam_score}, Legit: {legitimacy_score}, Domain: {domain_legitimacy}")
        
        return is_legitimate
    
    def _check_sender_domain_legitimacy(self, sender_email: str) -> int:
        """
        Check if sender domain appears legitimate for hiring emails
        
        Args:
            sender_email: Sender email address
            
        Returns:
            int: Legitimacy score (0-3)
        """
        if not sender_email or '@' not in sender_email:
            return 0
        
        domain = sender_email.split('@')[1].lower()
        
        # Known legitimate recruiting/job platforms
        legitimate_platforms = [
            'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com',
            'ziprecruiter.com', 'careerbuilder.com', 'dice.com',
            'angellist.com', 'wellfound.com', 'hired.com', 'triplebyte.com'
        ]
        
        # Corporate domains (not free email providers)
        corporate_indicators = [
            'corp.', 'company.', 'inc.', 'llc.', 'ltd.',
            '.edu', '.gov', '.org'
        ]
        
        # Free email providers (lower trust for professional outreach)
        free_providers = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'aol.com', 'icloud.com', 'protonmail.com'
        ]
        
        if domain in legitimate_platforms:
            return 3  # High trust
        elif any(indicator in domain for indicator in corporate_indicators):
            return 2  # Medium-high trust
        elif domain in free_providers:
            return 1  # Lower trust but not disqualifying
        elif '.' in domain and len(domain.split('.')) >= 2:
            return 2  # Appears to be a legitimate domain
        else:
            return 0  # Suspicious domain
    
    def _check_email_structure(self, email: Dict[str, Any]) -> int:
        """
        Check email structure for legitimacy indicators
        
        Args:
            email: Email data dictionary
            
        Returns:
            int: Structure score (0-2)
        """
        score = 0
        
        subject = email.get('subject', '')
        body_text = email.get('body_text', '')
        
        # Check subject line quality
        if subject and len(subject) > 10 and len(subject) < 200:
            score += 1
        
        # Check body content quality
        if body_text:
            # Has reasonable length
            if 50 < len(body_text) < 5000:
                score += 1
            
            # Contains professional language patterns
            professional_patterns = [
                r'\b(dear|hello|hi)\s+\w+', # Proper greeting
                r'\b(sincerely|best regards|thank you)', # Professional closing
                r'\b(company|organization|team|position|role)\b' # Business context
            ]
            
            if any(re.search(pattern, body_text, re.IGNORECASE) for pattern in professional_patterns):
                score += 1
        
        return min(score, 2)  # Cap at 2 points