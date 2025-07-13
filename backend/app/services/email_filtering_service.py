import json
import re
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime

from .openai_service import OpenAIService

class EmailFilteringService:
    """Service for AI-powered email filtering and categorization"""
    
    def __init__(self, openai_service: OpenAIService):
        """
        Initialize email filtering service
        
        Args:
            openai_service: Instance of OpenAIService for AI analysis
        """
        self.openai_service = openai_service
        
        # Keywords that strongly indicate hiring-related emails
        self.hiring_keywords = {
            'high_confidence': [
                'interview', 'job offer', 'position', 'recruiter', 'hiring manager',
                'job opportunity', 'application', 'resume', 'cv', 'background check',
                'onboarding', 'salary', 'compensation', 'offer letter', 'contract',
                'start date', 'first day', 'orientation', 'team meeting',
                'technical assessment', 'coding challenge', 'take home test',
                'phone screen', 'video interview', 'in-person interview',
                'final round', 'reference check', 'drug test', 'employment',
                'join our team', 'congratulations', 'we would like to offer',
                'next steps', 'feedback', 'thank you for interviewing'
            ],
            'medium_confidence': [
                'opportunity', 'career', 'talent', 'candidate', 'screening',
                'assessment', 'discussion', 'chat', 'call', 'meeting',
                'role', 'position available', 'opening', 'vacancy',
                'human resources', 'hr', 'people team', 'talent acquisition'
            ],
            'low_confidence': [
                'professional', 'network', 'connect', 'linkedin',
                'introduction', 'referral', 'recommendation'
            ]
        }
        
        # Company domains that are likely recruiters or job boards
        self.recruiter_domains = [
            'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com',
            'ziprecruiter.com', 'careerbuilder.com', 'dice.com',
            'angellist.com', 'wellfound.com', 'hired.com', 'triplebyte.com',
            'toptal.com', 'upwork.com', 'freelancer.com'
        ]
        
        # Email categories mapping
        self.category_mapping = {
            'job_application': 'JOB_APPLICATION',
            'interview_invitation': 'INTERVIEW_INVITATION',
            'rejection': 'REJECTION',
            'offer': 'OFFER',
            'recruiter_outreach': 'RECRUITER_OUTREACH',
            'follow_up': 'FOLLOW_UP',
            'other': 'OTHER'
        }
    
    def analyze_email(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze email to determine if it's hiring-related and extract relevant information
        
        Args:
            email_data: Email data dictionary
            
        Returns:
            Dict containing analysis results
        """
        try:
            # First check if this is spam
            spam_analysis = self._analyze_spam_likelihood(email_data)
            
            # If high spam likelihood, mark as not hiring-related
            if spam_analysis['is_likely_spam']:
                return {
                    'is_hiring_related': False,
                    'confidence_score': 0.1,
                    'category': 'OTHER',
                    'spam_analysis': spam_analysis,
                    'analysis_method': 'spam_filtered'
                }
            
            # Initial keyword-based filtering
            keyword_analysis = self._analyze_keywords(email_data)
            
            # If keyword analysis suggests it might be hiring-related, use AI for deeper analysis
            if keyword_analysis['confidence_score'] > 0.3:
                ai_analysis = self._ai_analyze_email(email_data)
                
                # Combine keyword and AI analysis
                final_analysis = self._combine_analyses(keyword_analysis, ai_analysis)
                final_analysis['spam_analysis'] = spam_analysis
            else:
                # Low confidence from keywords, skip AI analysis for efficiency
                final_analysis = keyword_analysis
                final_analysis['ai_analysis_performed'] = False
                final_analysis['spam_analysis'] = spam_analysis
            
            return final_analysis
            
        except Exception as e:
            print(f"[ERROR] Email analysis failed: {str(e)}")
            return self._default_analysis_result(email_data)
    
    def _analyze_keywords(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform keyword-based analysis of email content
        
        Args:
            email_data: Email data dictionary
            
        Returns:
            Dict containing keyword analysis results
        """
        text_content = f"{email_data.get('subject', '')} {email_data.get('body_text', '')}"
        text_content = text_content.lower()
        
        # Count keyword matches
        high_matches = sum(1 for keyword in self.hiring_keywords['high_confidence'] if keyword in text_content)
        medium_matches = sum(1 for keyword in self.hiring_keywords['medium_confidence'] if keyword in text_content)
        low_matches = sum(1 for keyword in self.hiring_keywords['low_confidence'] if keyword in text_content)
        
        # Check sender domain
        sender_email = email_data.get('sender_email', '').lower()
        domain_boost = 0.2 if any(domain in sender_email for domain in self.recruiter_domains) else 0
        
        # Calculate confidence score (0-1)
        confidence_score = min(1.0, (high_matches * 0.3 + medium_matches * 0.15 + low_matches * 0.05 + domain_boost))
        
        # Determine if hiring-related based on threshold
        is_hiring_related = confidence_score > 0.5
        
        # Basic category inference
        category = self._infer_category_from_keywords(text_content)
        
        return {
            'is_hiring_related': is_hiring_related,
            'confidence_score': confidence_score,
            'category': category,
            'keyword_matches': {
                'high': high_matches,
                'medium': medium_matches,
                'low': low_matches
            },
            'domain_boost': domain_boost > 0,
            'analysis_method': 'keyword'
        }
    
    def _infer_category_from_keywords(self, text_content: str) -> str:
        """
        Infer email category based on keyword patterns
        
        Args:
            text_content: Lowercase email content
            
        Returns:
            Category string
        """
        if any(word in text_content for word in ['interview', 'schedule', 'meeting', 'call']):
            return 'INTERVIEW_INVITATION'
        elif any(word in text_content for word in ['offer', 'congratulations', 'pleased to offer']):
            return 'OFFER'
        elif any(word in text_content for word in ['unfortunately', 'not moving forward', 'different direction']):
            return 'REJECTION'
        elif any(word in text_content for word in ['follow up', 'checking in', 'update']):
            return 'FOLLOW_UP'
        elif any(word in text_content for word in ['recruiter', 'opportunity', 'interested in']):
            return 'RECRUITER_OUTREACH'
        elif any(word in text_content for word in ['application', 'applied', 'position']):
            return 'JOB_APPLICATION'
        else:
            return 'OTHER'
    
    def _analyze_spam_likelihood(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze email for spam indicators, especially for emails from spam folder
        
        Args:
            email_data: Email data dictionary
            
        Returns:
            Dict containing spam analysis results
        """
        subject = email_data.get('subject', '').lower()
        body_text = email_data.get('body_text', '').lower()
        sender_email = email_data.get('sender_email', '').lower()
        sender_name = email_data.get('sender_name', '').lower()
        labels = email_data.get('labels', [])
        
        spam_score = 0
        spam_indicators = []
        
        # Check if email is currently in spam folder
        is_in_spam = 'SPAM' in labels
        if is_in_spam:
            spam_score += 2
            spam_indicators.append('Currently in spam folder')
        
        # Content-based spam indicators
        spam_phrases = [
            # Obvious spam/scam phrases
            'make money fast', 'easy money', 'get rich quick', 'work from home scam',
            'no experience required', 'earn $', 'guaranteed income', 'click here now',
            'limited time offer', 'act now', 'urgent response required', 'limited time',
            'congratulations you have won', 'claim your prize', 'verify account',
            
            # Suspicious hiring/job scams
            'mystery shopper', 'envelope stuffing', 'data entry from home',
            'high paying job with no experience', 'earn thousands weekly',
            'payment processing', 'financial transaction', 'money transfer',
            'administrative assistant position', 'personal assistant from home',
            
            # Phishing indicators
            'update your information', 'confirm your identity', 'suspended account',
            'click this link', 'download attachment', 'install software',
            
            # Generic suspicious language
            'this is not spam', 'remove me from list', 'unsubscribe',
            'special offer', 'incredible deal', 'once in a lifetime',
            'opportunity of a lifetime', 'risk-free', 'money back guarantee'
        ]
        
        content = f"{subject} {body_text}"
        for phrase in spam_phrases:
            if phrase in content:
                spam_score += 1
                spam_indicators.append(f"Contains phrase: '{phrase}'")
        
        # Sender analysis
        if not sender_email or '@' not in sender_email:
            spam_score += 1
            spam_indicators.append('Invalid or missing sender email')
        else:
            domain = sender_email.split('@')[1] if '@' in sender_email else ''
            
            # Suspicious domains
            suspicious_domains = [
                'tempmail', 'guerrillamail', '10minutemail', 'mailinator',
                'throwaway', 'disposable', 'temp-mail'
            ]
            
            if any(suspicious in domain for suspicious in suspicious_domains):
                spam_score += 2
                spam_indicators.append('Temporary/disposable email domain')
            
            # Check for domain spoofing attempts
            spoofed_domains = [
                'gmai1.com', 'yahool.com', 'hotmai1.com', 'outlok.com',
                'linkedln.com', 'goog1e.com', 'microsof.com'
            ]
            
            if domain in spoofed_domains:
                spam_score += 3
                spam_indicators.append('Spoofed legitimate domain')
        
        # Subject line analysis
        if subject:
            # All caps subject (common in spam)
            if subject.isupper() and len(subject) > 10:
                spam_score += 1
                spam_indicators.append('Subject line in all caps')
            
            # Excessive punctuation
            if subject.count('!') > 2 or subject.count('?') > 2:
                spam_score += 1
                spam_indicators.append('Excessive punctuation in subject')
            
            # Generic/vague subjects
            generic_subjects = [
                'urgent', 'important', 'please read', 'hello', 'hi there',
                'job offer', 'employment opportunity', 'work from home'
            ]
            
            if any(generic in subject for generic in generic_subjects):
                spam_score += 0.5
                spam_indicators.append('Generic/vague subject line')
        
        # Body content analysis
        if body_text:
            # Check for suspicious patterns
            if len(body_text) < 50:  # Very short emails are often spam
                spam_score += 1
                spam_indicators.append('Unusually short email content')
            
            # Multiple currency symbols or amounts
            currency_count = body_text.count('$') + body_text.count('€') + body_text.count('£')
            if currency_count > 3:
                spam_score += 1
                spam_indicators.append('Multiple currency references')
            
            # Excessive links
            link_count = body_text.count('http') + body_text.count('www.')
            if link_count > 5:
                spam_score += 1
                spam_indicators.append('Excessive number of links')
        
        # Sender name analysis
        if sender_name:
            # Generic or suspicious names
            suspicious_names = [
                'admin', 'noreply', 'automated', 'system', 'robot',
                'hr department', 'hiring team', 'recruitment'
            ]
            
            if any(suspicious in sender_name.lower() for suspicious in suspicious_names):
                spam_score += 0.5
                spam_indicators.append('Generic/automated sender name')
        
        # Calculate final spam likelihood
        # Score interpretation:
        # 0-1: Very unlikely spam
        # 1-3: Low spam likelihood
        # 3-5: Medium spam likelihood
        # 5+: High spam likelihood
        
        is_likely_spam = spam_score >= 3
        confidence = min(spam_score / 6, 1.0)  # Normalize to 0-1
        
        return {
            'is_likely_spam': is_likely_spam,
            'spam_score': spam_score,
            'spam_confidence': confidence,
            'spam_indicators': spam_indicators,
            'is_in_spam_folder': is_in_spam,
            'analysis_details': {
                'total_indicators': len(spam_indicators),
                'score_threshold': 3,
                'max_score': 10
            }
        }
    
    def _ai_analyze_email(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use AI to analyze email content for hiring relevance
        
        Args:
            email_data: Email data dictionary
            
        Returns:
            Dict containing AI analysis results
        """
        try:
            subject = email_data.get('subject', '')
            body_text = email_data.get('body_text', '')
            sender_email = email_data.get('sender_email', '')
            
            # Truncate body text to avoid token limits
            max_body_length = 2000
            if len(body_text) > max_body_length:
                body_text = body_text[:max_body_length] + "..."
            
            prompt = f"""
            Analyze this email to determine if it's related to job hiring/recruitment and extract relevant information.
            Also assess if this could be spam masquerading as a legitimate hiring email.
            Return ONLY a valid JSON object with the following structure:

            {{
                "is_hiring_related": true/false,
                "confidence_score": 0.0-1.0,
                "category": "job_application|interview_invitation|rejection|offer|recruiter_outreach|follow_up|other",
                "company_name": "extracted company name or null",
                "job_title": "extracted job title/position or null",
                "priority": "low|medium|high",
                "key_details": ["list", "of", "key", "points"],
                "next_action_required": "description of what the recipient should do next or null",
                "spam_likelihood": "low|medium|high",
                "legitimacy_indicators": ["list", "of", "signs", "this", "is", "legitimate"],
                "red_flags": ["list", "of", "potential", "spam", "indicators"]
            }}

            Consider these factors for legitimacy:
            - Specific company names and roles vs. generic language
            - Professional tone and proper grammar
            - Realistic job descriptions and requirements
            - Legitimate company domains vs. suspicious domains
            - Specific next steps vs. vague requests
            - Reasonable compensation mentions vs. unrealistic promises

            Email details:
            Subject: {subject}
            From: {sender_email}
            Body: {body_text}
            """
            
            response = self.openai_service.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert email analyzer specializing in identifying hiring-related emails. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                ai_result = json.loads(result_text)
                
                # Validate and normalize the response
                ai_result['confidence_score'] = max(0.0, min(1.0, float(ai_result.get('confidence_score', 0.5))))
                ai_result['category'] = self.category_mapping.get(ai_result.get('category', 'other'), 'OTHER')
                ai_result['analysis_method'] = 'ai'
                
                return ai_result
                
            except json.JSONDecodeError as e:
                print(f"[ERROR] Failed to parse AI response JSON: {e}")
                print(f"[DEBUG] AI response: {result_text}")
                return self._default_ai_result()
                
        except Exception as e:
            print(f"[ERROR] AI email analysis failed: {str(e)}")
            return self._default_ai_result()
    
    def _combine_analyses(self, keyword_analysis: Dict, ai_analysis: Dict) -> Dict[str, Any]:
        """
        Combine keyword and AI analysis results
        
        Args:
            keyword_analysis: Results from keyword analysis
            ai_analysis: Results from AI analysis
            
        Returns:
            Combined analysis results
        """
        # Weighted combination of confidence scores
        keyword_weight = 0.3
        ai_weight = 0.7
        
        combined_confidence = (
            keyword_analysis['confidence_score'] * keyword_weight +
            ai_analysis['confidence_score'] * ai_weight
        )
        
        # Use AI results as primary, fall back to keyword analysis
        is_hiring_related = ai_analysis.get('is_hiring_related', keyword_analysis['is_hiring_related'])
        category = ai_analysis.get('category', keyword_analysis['category'])
        
        return {
            'is_hiring_related': is_hiring_related,
            'confidence_score': combined_confidence,
            'category': category,
            'company_name': ai_analysis.get('company_name'),
            'job_title': ai_analysis.get('job_title'),
            'priority': ai_analysis.get('priority', 'medium'),
            'key_details': ai_analysis.get('key_details', []),
            'next_action_required': ai_analysis.get('next_action_required'),
            'spam_likelihood': ai_analysis.get('spam_likelihood', 'low'),
            'legitimacy_indicators': ai_analysis.get('legitimacy_indicators', []),
            'red_flags': ai_analysis.get('red_flags', []),
            'keyword_analysis': keyword_analysis,
            'ai_analysis_performed': True,
            'analysis_method': 'combined'
        }
    
    def _default_analysis_result(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Return default analysis result when analysis fails
        
        Args:
            email_data: Email data dictionary
            
        Returns:
            Default analysis result
        """
        return {
            'is_hiring_related': False,
            'confidence_score': 0.0,
            'category': 'OTHER',
            'company_name': None,
            'job_title': None,
            'priority': 'low',
            'key_details': [],
            'next_action_required': None,
            'ai_analysis_performed': False,
            'analysis_method': 'default'
        }
    
    def _default_ai_result(self) -> Dict[str, Any]:
        """
        Return default AI analysis result when AI analysis fails
        
        Returns:
            Default AI analysis result
        """
        return {
            'is_hiring_related': False,
            'confidence_score': 0.5,
            'category': 'OTHER',
            'company_name': None,
            'job_title': None,
            'priority': 'medium',
            'key_details': [],
            'next_action_required': None,
            'spam_likelihood': 'medium',
            'legitimacy_indicators': [],
            'red_flags': [],
            'analysis_method': 'ai_fallback'
        }
    
    def batch_analyze_emails(self, emails: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze multiple emails in batch
        
        Args:
            emails: List of email data dictionaries
            
        Returns:
            List of analysis results
        """
        results = []
        
        for email in emails:
            try:
                analysis = self.analyze_email(email)
                results.append({
                    'email_id': email.get('id'),
                    'analysis': analysis
                })
            except Exception as e:
                print(f"[ERROR] Failed to analyze email {email.get('id', 'unknown')}: {str(e)}")
                results.append({
                    'email_id': email.get('id'),
                    'analysis': self._default_analysis_result(email)
                })
        
        return results
    
    def filter_hiring_emails(self, emails: List[Dict[str, Any]], 
                           min_confidence: float = 0.6) -> Tuple[List[Dict], List[Dict]]:
        """
        Filter emails to separate hiring-related from non-hiring emails
        
        Args:
            emails: List of email data dictionaries
            min_confidence: Minimum confidence threshold for hiring classification
            
        Returns:
            Tuple of (hiring_emails, non_hiring_emails)
        """
        hiring_emails = []
        non_hiring_emails = []
        
        for email in emails:
            analysis = self.analyze_email(email)
            
            if analysis['is_hiring_related'] and analysis['confidence_score'] >= min_confidence:
                email['analysis'] = analysis
                hiring_emails.append(email)
            else:
                email['analysis'] = analysis
                non_hiring_emails.append(email)
        
        return hiring_emails, non_hiring_emails
    
    def extract_company_info(self, email_data: Dict[str, Any]) -> Dict[str, Optional[str]]:
        """
        Extract company information from email
        
        Args:
            email_data: Email data dictionary
            
        Returns:
            Dict containing extracted company information
        """
        sender_email = email_data.get('sender_email', '')
        domain = sender_email.split('@')[-1] if '@' in sender_email else ''
        
        # Try to extract company name from domain
        company_name = None
        if domain and not any(rec_domain in domain for rec_domain in self.recruiter_domains):
            # Remove common suffixes and clean up domain
            company_name = domain.replace('.com', '').replace('.org', '').replace('.net', '')
            company_name = company_name.replace('www.', '').split('.')[0]
            company_name = company_name.title()
        
        return {
            'company_name': company_name,
            'domain': domain,
            'is_recruiter_domain': any(rec_domain in domain for rec_domain in self.recruiter_domains)
        }
    
    def get_hiring_statistics(self, emails: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate statistics about hiring-related emails
        
        Args:
            emails: List of analyzed emails
            
        Returns:
            Dict containing statistics
        """
        total_emails = len(emails)
        hiring_emails = [e for e in emails if e.get('analysis', {}).get('is_hiring_related', False)]
        
        # Category breakdown
        categories = {}
        for email in hiring_emails:
            category = email.get('analysis', {}).get('category', 'OTHER')
            categories[category] = categories.get(category, 0) + 1
        
        # Confidence distribution
        confidence_ranges = {'0.0-0.3': 0, '0.3-0.6': 0, '0.6-0.8': 0, '0.8-1.0': 0}
        for email in hiring_emails:
            score = email.get('analysis', {}).get('confidence_score', 0)
            if score < 0.3:
                confidence_ranges['0.0-0.3'] += 1
            elif score < 0.6:
                confidence_ranges['0.3-0.6'] += 1
            elif score < 0.8:
                confidence_ranges['0.6-0.8'] += 1
            else:
                confidence_ranges['0.8-1.0'] += 1
        
        return {
            'total_emails': total_emails,
            'hiring_emails': len(hiring_emails),
            'hiring_percentage': (len(hiring_emails) / total_emails * 100) if total_emails > 0 else 0,
            'categories': categories,
            'confidence_distribution': confidence_ranges,
            'analysis_methods': {
                'keyword_only': len([e for e in hiring_emails if e.get('analysis', {}).get('analysis_method') == 'keyword']),
                'ai_enhanced': len([e for e in hiring_emails if e.get('analysis', {}).get('ai_analysis_performed', False)])
            }
        } 