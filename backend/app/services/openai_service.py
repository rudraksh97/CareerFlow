from openai import OpenAI
import requests
from bs4 import BeautifulSoup
import json
from typing import Optional, Dict, Any
import re

class OpenAIService:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
    
    def test_api_key(self) -> bool:
        """Test if the OpenAI API key is valid"""
        try:
            print("[DEBUG] Testing OpenAI API key...")
            # Make a simple API call to test the key
            response = self.client.models.list()
            print(f"[DEBUG] API key test successful, found {len(response.data)} models")
            return True
        except Exception as e:
            print(f"[ERROR] OpenAI API key test failed: {str(e)}")
            print(f"[ERROR] Exception type: {type(e)}")
            return False
    
    def fetch_webpage_content(self, url: str) -> Optional[str]:
        """Fetch and clean webpage content"""
        try:
            print(f"[DEBUG] Fetching webpage content from: {url}")
            
            # Enhanced headers to appear more like a real browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            }
            
            # Create a session for better handling
            session = requests.Session()
            session.headers.update(headers)
            
            # First, try to get the page
            response = session.get(url, timeout=15, allow_redirects=True)
            print(f"[DEBUG] HTTP response status: {response.status_code}")
            print(f"[DEBUG] Final URL after redirects: {response.url}")
            print(f"[DEBUG] Response content length: {len(response.content)} bytes")
            
            response.raise_for_status()
            
            # Parse HTML and extract text
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try to find specific job posting content areas first
            job_content = None
            
            # Common selectors for job posting content
            content_selectors = [
                '[data-testid*="job"]',
                '.job-description',
                '.job-details', 
                '.job-content',
                '.posting-content',
                '.position-description',
                '[role="main"]',
                'main',
                '.content',
                '#job-description',
                '#job-details'
            ]
            
            for selector in content_selectors:
                elements = soup.select(selector)
                if elements:
                    print(f"[DEBUG] Found content using selector: {selector}")
                    job_content = ' '.join([elem.get_text(strip=True) for elem in elements])
                    break
            
            # If no specific job content found, fall back to full page
            if not job_content or len(job_content.strip()) < 100:
                print("[DEBUG] Using full page content as fallback")
                
                # Remove script, style, and navigation elements
                for script in soup(["script", "style", "nav", "header", "footer"]):
                    script.decompose()
                
                # Get text and clean it
                job_content = soup.get_text()
            
            # Clean the text
            lines = (line.strip() for line in job_content.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            # If content is still very short, it might be a SPA - try to extract any visible text
            if len(text.strip()) < 100:
                print("[DEBUG] Content very short, extracting all visible text")
                # Get all text content, including from data attributes
                all_text = []
                for elem in soup.find_all(text=True):
                    if elem.strip() and elem.parent.name not in ['script', 'style']:
                        all_text.append(elem.strip())
                text = ' '.join(all_text)
            
            # Limit content length to avoid token limits
            content = text[:8000]  # Roughly 2000 tokens
            print(f"[DEBUG] Final extracted content length: {len(content)} characters")
            print(f"[DEBUG] Content preview: {content[:200]}...")
            
            # Check if we have meaningful content
            if len(content.strip()) < 50:
                print("[ERROR] Extracted content is too short, might be a dynamic page")
                return None
                
            return content
            
        except Exception as e:
            print(f"[ERROR] Error fetching webpage: {str(e)}")
            print(f"[ERROR] Exception type: {type(e)}")
            return None
    
    def parse_job_details(self, url: str, webpage_content: str) -> Optional[Dict[str, Any]]:
        """Parse job details from webpage content using OpenAI"""
        try:
            print(f"[DEBUG] Starting OpenAI parsing for URL: {url}")
            print(f"[DEBUG] Content length for parsing: {len(webpage_content)} characters")
            
            prompt = f"""
            Analyze the following job posting webpage content and extract key information. 
            Return ONLY a valid JSON object with the following structure (no additional text):

            {{
                "company_name": "extracted company name",
                "job_title": "extracted job title/role name",
                "job_id": "extracted job ID if available, otherwise null",
                "job_url": "{url}",
                "location": "job location if available",
                "employment_type": "full-time/part-time/contract/etc if available",
                "experience_level": "entry/mid/senior/etc if available",
                "department": "department/team if available",
                "salary_range": "salary information if available",
                "remote_options": "remote/hybrid/onsite if available"
            }}

            If any field cannot be determined from the content, set it to null.
            Make sure to return valid JSON only.

            Job posting content:
            {webpage_content}
            """
            
            print("[DEBUG] Sending request to OpenAI...")
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a job posting analyzer. Extract information accurately and return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            result = response.choices[0].message.content.strip()
            print(f"[DEBUG] OpenAI response: {result[:200]}...")
            
            # Clean the response to ensure it's valid JSON
            if result.startswith('```json'):
                result = result[7:]
            if result.endswith('```'):
                result = result[:-3]
            result = result.strip()
            
            print("[DEBUG] Attempting to parse JSON...")
            # Parse JSON
            job_data = json.loads(result)
            print(f"[DEBUG] Successfully parsed JSON: {job_data}")
            
            # Validate required fields
            if not job_data.get('company_name') or not job_data.get('job_title'):
                print(f"[DEBUG] Missing required fields - company_name: {job_data.get('company_name')}, job_title: {job_data.get('job_title')}")
                return None
                
            return job_data
            
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON parsing error: {str(e)}")
            print(f"[ERROR] Raw response: {result}")
            return None
        except Exception as e:
            print(f"[ERROR] Error parsing job details: {str(e)}")
            print(f"[ERROR] Exception type: {type(e)}")
            return None
    
    def parse_job_url(self, url: str) -> Optional[Dict[str, Any]]:
        """Main method to parse job URL and extract details"""
        print(f"[DEBUG] parse_job_url called with URL: {url}")
        
        # Validate URL format
        print("[DEBUG] Validating URL format...")
        if not self._is_valid_url(url):
            print("[ERROR] Invalid URL format")
            return None
        print("[DEBUG] URL format is valid")
            
        # Fetch webpage content
        print("[DEBUG] Fetching webpage content...")
        content = self.fetch_webpage_content(url)
        if not content:
            print("[ERROR] Failed to fetch webpage content - this might be a dynamic page that requires JavaScript")
            return None
        print("[DEBUG] Successfully fetched webpage content")
            
        # Parse job details using OpenAI
        print("[DEBUG] Parsing job details with OpenAI...")
        job_details = self.parse_job_details(url, content)
        
        if not job_details:
            print("[ERROR] Failed to parse job details")
            return None
        
        # Generate a job ID if not found
        if not job_details.get('job_id'):
            print("[DEBUG] Generating job ID...")
            job_details['job_id'] = self._generate_job_id(url, job_details.get('company_name', ''))
            print(f"[DEBUG] Generated job ID: {job_details['job_id']}")
            
        print(f"[DEBUG] Final job details: {job_details}")
        return job_details
    
    def _is_valid_url(self, url: str) -> bool:
        """Validate URL format"""
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        return url_pattern.match(url) is not None
    
    def _generate_job_id(self, url: str, company_name: str) -> str:
        """Generate a job ID from URL and company name"""
        # Extract meaningful parts from URL
        url_parts = url.split('/')
        
        # Look for numeric IDs in URL
        for part in url_parts:
            if part.isdigit() and len(part) >= 3:
                return part
                
        # Look for alphanumeric job IDs
        for part in url_parts:
            if re.match(r'^[A-Za-z0-9]+$', part) and len(part) >= 5:
                return part
                
        # Fallback: use company name + hash of URL
        import hashlib
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        company_short = re.sub(r'[^A-Za-z0-9]', '', company_name)[:10] if company_name else 'JOB'
        return f"{company_short}_{url_hash}" 