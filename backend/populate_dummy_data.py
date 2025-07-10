#!/usr/bin/env python3
"""
Dummy Data Population Script for PATS
Populates the database with realistic sample data for UI testing
"""

import os
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path
import random

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import sessionmaker
from app.models.database import engine, Base
from app.models.application import Application, ApplicationStatus, ApplicationSource, ApplicationPriority
from app.models.contact import Contact, ContactType, Interaction
from app.models.profile import Profile
from app.models.setting import Setting
from app.models.referral_message import ReferralMessage, ReferralMessageType

# Create tables
Base.metadata.create_all(bind=engine)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def clear_existing_data():
    """Clear all existing data from the database"""
    session = SessionLocal()
    try:
        session.query(Interaction).delete()
        session.query(Contact).delete()
        session.query(Application).delete()
        session.query(ReferralMessage).delete()
        session.query(Profile).delete()
        session.query(Setting).delete()
        session.commit()
        print("✅ Cleared existing data")
    except Exception as e:
        print(f"❌ Error clearing data: {e}")
        session.rollback()
    finally:
        session.close()

def create_dummy_companies():
    """Sample companies for realistic data"""
    return [
        "Google", "Microsoft", "Apple", "Amazon", "Meta", "Netflix", "Tesla", 
        "Spotify", "Airbnb", "Uber", "Stripe", "Coinbase", "Databricks",
        "OpenAI", "Anthropic", "Scale AI", "Palantir", "Snowflake", "Figma",
        "Linear", "Notion", "Discord", "Slack", "Zoom", "Dropbox", "Adobe",
        "Salesforce", "ServiceNow", "Twilio", "MongoDB", "Atlassian", "GitHub",
        "GitLab", "Docker", "Kubernetes Inc.", "Red Hat", "Canonical", "Elastic",
        "Datadog", "New Relic", "PagerDuty", "Splunk", "Okta", "Auth0",
        "Cloudflare", "Fastly", "Vercel", "Netlify", "Supabase", "PlanetScale"
    ]

def create_dummy_job_titles():
    """Sample job titles for realistic data"""
    return [
        "Software Engineer", "Senior Software Engineer", "Staff Software Engineer",
        "Principal Software Engineer", "Engineering Manager", "Senior Engineering Manager",
        "Frontend Engineer", "Backend Engineer", "Full Stack Engineer",
        "DevOps Engineer", "Site Reliability Engineer", "Platform Engineer",
        "Data Engineer", "Machine Learning Engineer", "AI Engineer",
        "Product Manager", "Senior Product Manager", "Principal Product Manager",
        "Technical Product Manager", "Product Designer", "UX Designer",
        "UI Designer", "Design Systems Engineer", "Technical Writer",
        "Security Engineer", "Cloud Engineer", "Infrastructure Engineer",
        "Mobile Engineer", "iOS Engineer", "Android Engineer",
        "QA Engineer", "Test Engineer", "Automation Engineer"
    ]

def create_dummy_names():
    """Sample names for contacts"""
    first_names = [
        "Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn",
        "Cameron", "Sage", "River", "Rowan", "Parker", "Finley", "Emery", "Blake",
        "Drew", "Reese", "Skylar", "Hayden", "Peyton", "Dakota", "Charlie", "Kai"
    ]
    last_names = [
        "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
        "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia",
        "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall"
    ]
    return [f"{random.choice(first_names)} {random.choice(last_names)}" for _ in range(50)]

def populate_applications():
    """Create realistic job application data"""
    session = SessionLocal()
    
    companies = create_dummy_companies()
    job_titles = create_dummy_job_titles()
    statuses = list(ApplicationStatus)
    sources = list(ApplicationSource)
    priorities = list(ApplicationPriority)
    
    applications = []
    
    # Create 75 applications with varied dates over the past 6 months
    for i in range(75):
        company = random.choice(companies)
        job_title = random.choice(job_titles)
        
        # Create dates spread over the past 6 months
        days_ago = random.randint(1, 180)
        date_applied = datetime.utcnow() - timedelta(days=days_ago)
        
        # Weight statuses realistically (more applied/pending, fewer offers)
        status_weights = {
            ApplicationStatus.APPLIED: 0.4,
            ApplicationStatus.PENDING: 0.25,
            ApplicationStatus.INTERVIEW: 0.15,
            ApplicationStatus.REJECTED: 0.15,
            ApplicationStatus.OFFER: 0.03,
            ApplicationStatus.WITHDRAWN: 0.02
        }
        status = random.choices(list(status_weights.keys()), weights=list(status_weights.values()))[0]
        
        application = Application(
            id=str(uuid.uuid4()),
            company_name=company,
            job_title=job_title,
            job_id=f"{company.lower().replace(' ', '-')}-{uuid.uuid4().hex[:8]}",
            job_url=f"https://{company.lower().replace(' ', '')}.com/jobs/{uuid.uuid4().hex[:8]}",
            portal_url=f"https://{company.lower().replace(' ', '')}.com/careers" if random.choice([True, False]) else None,
            status=status,
            priority=random.choice(priorities),
            date_applied=date_applied,
            email_used=random.choice(["john.doe@gmail.com", "j.doe@protonmail.com", "johndoe.work@gmail.com"]),
            resume_filename=f"resume_v{random.randint(1, 5)}.pdf",
            resume_file_path=f"uploads/resumes/resume_v{random.randint(1, 5)}.pdf",
            cover_letter_filename=f"cover_letter_{company.lower().replace(' ', '_')}.pdf" if random.choice([True, False, False]) else None,
            cover_letter_file_path=f"uploads/cover_letters/cover_letter_{company.lower().replace(' ', '_')}.pdf" if random.choice([True, False, False]) else None,
            source=random.choice(sources),
            notes=random.choice([
                f"Applied through {random.choice(['LinkedIn', 'company website', 'referral'])}",
                f"Recruiter reached out on {random.choice(['LinkedIn', 'email'])}",
                f"Found via {random.choice(['AngelList', 'Y Combinator jobs', 'Indeed'])}",
                "Strong culture fit, exciting product",
                "Remote-first company, great benefits",
                "Growing startup with interesting tech stack",
                None, None  # Some applications have no notes
            ])
        )
        applications.append(application)
    
    try:
        session.add_all(applications)
        session.commit()
        print(f"✅ Created {len(applications)} job applications")
    except Exception as e:
        print(f"❌ Error creating applications: {e}")
        session.rollback()
    finally:
        session.close()

def populate_contacts():
    """Create realistic contact data"""
    session = SessionLocal()
    
    companies = create_dummy_companies()
    names = create_dummy_names()
    contact_types = list(ContactType)
    
    contacts = []
    
    # Create 50 contacts
    for i in range(50):
        name = names[i] if i < len(names) else f"Contact {i}"
        company = random.choice(companies)
        contact_type = random.choice(contact_types)
        
        # Generate email from name
        email_name = name.lower().replace(" ", ".")
        email_domain = random.choice([
            f"{company.lower().replace(' ', '')}.com",
            "gmail.com", "protonmail.com", "outlook.com"
        ])
        
        contact = Contact(
            id=str(uuid.uuid4()),
            name=name,
            email=f"{email_name}@{email_domain}",
            company=company,
            role=random.choice([
                "Recruiter", "Senior Recruiter", "Technical Recruiter",
                "Engineering Manager", "Senior Engineering Manager", 
                "Staff Engineer", "Principal Engineer", "VP of Engineering",
                "Product Manager", "Senior Product Manager", "Head of Product",
                "People Operations", "Talent Acquisition", "HR Business Partner"
            ]),
            linkedin_url=f"https://linkedin.com/in/{name.lower().replace(' ', '')}" if random.choice([True, False]) else None,
            contact_type=contact_type,
            notes=random.choice([
                f"Met at {random.choice(['tech conference', 'networking event', 'meetup'])}",
                f"Connected through {random.choice(['mutual friend', 'LinkedIn', 'referral'])}",
                "Very responsive and helpful with application process",
                "Provided valuable insights about company culture",
                "Offered to review resume and provide feedback",
                None, None  # Some contacts have no notes
            ])
        )
        contacts.append(contact)
    
    try:
        session.add_all(contacts)
        session.commit()
        print(f"✅ Created {len(contacts)} contacts")
        
        # Create interactions for some contacts
        create_interactions(session, contacts)
        
    except Exception as e:
        print(f"❌ Error creating contacts: {e}")
        session.rollback()
    finally:
        session.close()

def create_interactions(session, contacts):
    """Create interactions for contacts"""
    interactions = []
    
    # Create 2-5 interactions for each contact
    for contact in contacts[:20]:  # Only first 20 contacts to keep data manageable
        num_interactions = random.randint(1, 4)
        
        for i in range(num_interactions):
            days_ago = random.randint(1, 90)
            interaction_date = datetime.utcnow() - timedelta(days=days_ago)
            
            interaction = Interaction(
                id=str(uuid.uuid4()),
                contact_id=contact.id,
                interaction_type=random.choice(["email", "linkedin_message", "phone_call", "coffee_chat", "video_call"]),
                notes=random.choice([
                    "Initial outreach - introduced myself and expressed interest",
                    "Follow-up on job application status",
                    "Discussed role requirements and company culture",
                    "Scheduled technical interview",
                    "Thank you note after interview",
                    "Asked for feedback on application",
                    "Requested referral for open position"
                ]),
                date=interaction_date
            )
            interactions.append(interaction)
    
    try:
        session.add_all(interactions)
        session.commit()
        print(f"✅ Created {len(interactions)} contact interactions")
    except Exception as e:
        print(f"❌ Error creating interactions: {e}")
        session.rollback()

def populate_profile():
    """Create user profile data"""
    session = SessionLocal()
    
    try:
        profile = Profile(
            id=1,
            full_name="John Doe",
            email="john.doe@gmail.com",
            headline="Senior Software Engineer | Full-Stack Developer | React & Python",
            linkedin_url="https://linkedin.com/in/johndoe"
        )
        session.add(profile)
        session.commit()
        print("✅ Created user profile")
    except Exception as e:
        print(f"❌ Error creating profile: {e}")
        session.rollback()
    finally:
        session.close()

def populate_settings():
    """Create application settings"""
    session = SessionLocal()
    
    settings = [
        Setting(key="openai_api_key", value="sk-test-dummy-api-key-for-testing"),
        Setting(key="default_email", value="john.doe@gmail.com"),
        Setting(key="linkedin_profile", value="https://linkedin.com/in/johndoe"),
        Setting(key="github_profile", value="https://github.com/johndoe"),
        Setting(key="portfolio_website", value="https://johndoe.dev"),
    ]
    
    try:
        session.add_all(settings)
        session.commit()
        print(f"✅ Created {len(settings)} application settings")
    except Exception as e:
        print(f"❌ Error creating settings: {e}")
        session.rollback()
    finally:
        session.close()

def populate_referral_messages():
    """Create referral message templates"""
    session = SessionLocal()
    
    message_templates = [
        {
            "title": "Cold Outreach to Engineer",
            "message_type": ReferralMessageType.COLD_OUTREACH,
            "subject_template": "Interest in {position_title} role at {company_name}",
            "message_template": """Hi {contact_name},

I hope this message finds you well! I came across the {position_title} position at {company_name} and was really excited about the opportunity.

I'm a software engineer with {experience_years} years of experience in {tech_stack}. I've been following {company_name}'s work in {industry_focus} and I'm particularly impressed by {specific_project}.

I'd love to learn more about the role and the team. Would you be open to a brief chat about your experience at {company_name}?

Best regards,
{your_name}""",
            "target_company": "Tech Companies",
            "target_position": "Software Engineer",
            "is_active": True,
            "notes": "Use for reaching out to engineers at target companies"
        },
        {
            "title": "Recruiter Follow-up",
            "message_type": ReferralMessageType.FOLLOW_UP,
            "subject_template": "Following up on {position_title} application",
            "message_template": """Hi {contact_name},

I wanted to follow up on my application for the {position_title} role at {company_name} that I submitted on {application_date}.

I'm very excited about this opportunity and would love to discuss how my background in {relevant_skills} could contribute to the team.

Is there any additional information I can provide to support my application?

Thank you for your time and consideration.

Best regards,
{your_name}""",
            "target_company": "All Companies",
            "target_position": "Any Position",
            "is_active": True,
            "notes": "Use for following up with recruiters on pending applications"
        },
        {
            "title": "Networking Introduction",
            "message_type": ReferralMessageType.NETWORKING,
            "subject_template": "Introduction and networking",
            "message_template": """Hi {contact_name},

I hope you're doing well! I found your profile through {connection_source} and noticed we share similar backgrounds in {shared_interest}.

I'm currently exploring new opportunities in {field_of_interest} and would love to connect with professionals in the industry. Your experience at {company_name} particularly caught my attention.

Would you be open to a brief virtual coffee chat? I'd love to learn about your journey and get your insights on the industry.

Looking forward to connecting!

Best regards,
{your_name}""",
            "target_company": "Various",
            "target_position": "Networking",
            "is_active": True,
            "notes": "Use for general networking and building professional relationships"
        },
        {
            "title": "Thank You After Interview",
            "message_type": ReferralMessageType.THANK_YOU,
            "subject_template": "Thank you for the {position_title} interview",
            "message_template": """Hi {contact_name},

Thank you for taking the time to interview me for the {position_title} position at {company_name} today. I really enjoyed our conversation about {discussion_topic} and learning more about the team's goals.

The role sounds like an excellent fit for my background in {relevant_experience}, and I'm excited about the possibility of contributing to {specific_project}.

Please let me know if you need any additional information from me. I look forward to hearing about the next steps.

Best regards,
{your_name}""",
            "target_company": "Post-Interview",
            "target_position": "Any Position",
            "is_active": True,
            "notes": "Send within 24 hours after an interview"
        }
    ]
    
    referral_messages = []
    for template_data in message_templates:
        message = ReferralMessage(
            id=str(uuid.uuid4()),
            **template_data
        )
        referral_messages.append(message)
    
    try:
        session.add_all(referral_messages)
        session.commit()
        print(f"✅ Created {len(referral_messages)} referral message templates")
    except Exception as e:
        print(f"❌ Error creating referral messages: {e}")
        session.rollback()
    finally:
        session.close()

def main():
    """Main function to populate all dummy data"""
    print("🚀 Starting dummy data population...")
    print("=" * 50)
    
    # Clear existing data
    clear_existing_data()
    
    # Create upload directories
    os.makedirs("uploads/resumes", exist_ok=True)
    os.makedirs("uploads/cover_letters", exist_ok=True)
    
    # Populate data
    populate_profile()
    populate_settings()
    populate_applications()
    populate_contacts()
    populate_referral_messages()
    
    print("=" * 50)
    print("✅ Dummy data population completed successfully!")
    print("\n📊 Summary:")
    print("   • 75 Job Applications (various statuses and companies)")
    print("   • 50 Professional Contacts (with interactions)")
    print("   • 1 User Profile")
    print("   • 5 Application Settings")
    print("   • 4 Referral Message Templates")
    print("\n🔗 Ready for UI testing with Playwright!")

if __name__ == "__main__":
    main() 