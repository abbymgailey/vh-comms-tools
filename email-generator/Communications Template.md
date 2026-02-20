# [STUDY NAME] Communications

Last Update: [DATE]

## Metadata

**Study Name**: [STUDY NAME]   
**Study Team Email**: [team@study.org]   
**Study Team Phone**: [(xxx) xxx-xxxx]  
**Portal Link**: [https://study.vibrenthealth.com/]  
**Postal Address**: [Street Address City, State ZIP]  

**System Comms Footer**: If you have any questions, or if you wish to report a problem that may be related to this research study, please email us at {{studyTeamEmail}}.

**Marketing Footer**: If you have any questions, or if you wish to report a problem that may be related to this research study, please email us at {{studyTeamEmail}}. To unsubscribe or update your preferences, \[click here\]({{hostedUnsubscribeUrl}})

{{postalAddress}}

### Variables Reference

- `{{studyName}}`
- `{{studyTeamEmail}}`
- `{{studyTeamPhone}}`
- `{{portalLink}}`
- `{{postalAddress}}`
- `{{hostedUnsubscribeUrl}}`

—

# System Communications

—

## S1: Verify Your Email Address

**Trigger:** Account Creation  
**Timing:** Immediately after account created  
**Subject:** Verify Your Email Address {{studyName}}  
**Template**: template-basic  
**Type:** System

**Email Content:**

Dear Participant,

Someone used this email address to sign up for a {{studyName}} account. If that was you, please verify your email address by entering this verification code into your {{studyName}} account page:

\[CODE DYNAMICALLY ENTERED HERE\]

This code expires in 30 minutes and you can only use it once. If your code has expired or you run into any problems, please request another code through your {{studyName}} account page.

If you didn't sign up for a {{studyName}} account, please contact us at {{studyTeamEmail}}.

Thank You,

The {{studyName}} Study Team

—

## S2: Reset Password

**Trigger**: Participant indicates they forgot their password  
**Timing**: Immediately after "forgot password" selected  
**Subject**: Reset Your Password For the {{studyName}}  
**Template**: template-basic  
**Type**: System  

**Email Content:**

Dear Participant,

This email was used to request a reset of your {{studyName}} account password. If that was you, please verify your email address by entering this verification code into your {{studyName}} account page:

\[CODE DYNAMICALLY ENTERED HERE\]

This code expires in 30 minutes and you can only use it once. If your code has expired or you run into any problems, please request another code through your {{studyName}} account page.

If you didn't sign up for a {{studyName}} account, please contact us by phone at {{studyTeamPhone}} or by email at {{studyTeamEmail}}.

Thank You,

The {{studyName}} Study Team

—

## S3: Account Locked

**Trigger**: Participant login fails twice within one second OR five times within 12 hours  
**Timing**: Immediately after account is locked  
**Subject**: Your {{studyName}} Account is Locked  
**Template**: template-basic  
**Type**: System  

**Email Content:**

Dear Participant,

We're sorry\! Your account has been locked out. Please reset your password after one hour or contact us via email at {{studyTeamEmail}}.

Thank you for being a part of the {{studyName}} Study.

Thank you,

The {{studyName}} Team

—

## S4: Welcome

**Trigger**: Account Creation  
**Timing**: Immediately after account has been created  
**Subject**: Welcome to {{studyName}}  
**Template**: template-basic  
**Type**: System  

**Email Content:**

We're thrilled you've decided to join {{studyName}}.

If you have any additional questions about this study, please feel free to contact us by phone at {{studyTeamPhone}} or by email at {{studyTeamEmail}}.

Thank you,

The {{studyName}} Team

—

## S5: Withdrawal

**Trigger**:  
**Timing**:  
**Subject**: Withdrawal from {{studyName}}  
**Template**: template-basic  
**Type**: System  

**Email Content:**

Dear Participant,

We received your request to end your participation in {{studyName}}. Your information will not be used for new studies.

Here's what will happen now:

- We will no longer ask you to participate in {{studyName}} activities.
- We will remove your email address and phone number from our contact list. This may take a couple of days, so please be patient if you receive another email or phone call in the meantime.

If you change your mind at any time and decide you'd like to participate again, we'll ask you to create a new account, complete the consent process, and begin the study again. If this is an error, please contact our study team by phone at {{studyTeamPhone}} or by email at {{studyTeamEmail}}.

Thank you,

The {{studyName}} Team

—

## S6: Consent Confirmation \+ Copy of Consent

**Trigger**: Participant completes consent form  
**Timing**: Immediately after consent completion  
**Subject**: Your {{studyName}} Consent Form  
**Template**: template-basic  
**Type**: System

**Email Content:**

Dear Participant,

We have attached a copy of the consent form you signed when you joined {{studyName}}.

If you have any questions about this consent form, please contact us by phone at {{studyTeamPhone}} or by email at {{studyTeamEmail}}.

Thank you,

The {{studyName}} Team

—

# Custom Communications

—

## M1: Consent Reminder

**Trigger**: Consent is made available (containerItem [XXX] unlocked/visible)  
**Timing**: Consent is unlocked / visible and is not yet completed after 5 days  
**Subject**: Complete Your {{studyName}} Consent Form  
**Template**: template-with-button. 
**Type**: Marketing

**Email Header: Reminder: Complete Your Consent to Participate in {{studyName}}**

**Email Content:**

Dear Participant,

This is a reminder to complete your consent to participate. The process usually only takes about 5 to 8 minutes.

\[ LOG IN \]

If you have any questions about this consent form, please contact our study team by phone at {{studyTeamPhone}} or by email at {{studyTeamEmail}}

Thank you,

The {{studyName}} Team

**SMS Content:**
This is a reminder to complete your consent for {{studyName}}. Log in today: {{portalLink}}

—

## M2: \[Survey\] Reminder

**Trigger**: Survey becomes available  
**Timing**: 3 days after form becomes available AND participant still hasn't completed form  
**Subject**: Reminder: Complete your \[Name of Survey\] Survey  
**Template**: template-with-button  
**Type**: Marketing

**Email Header: Reminder: Complete your \[Name of Survey\] Survey**

**Email Content:**

Dear Participant,

This is a reminder to login to the {{studyName}} portal to complete your \[Name of Survey\] survey.

\[ LOG IN \]

If you have any questions about this form, please contact our study team by phone at {{studyTeamPhone}} or by email at {{studyTeamEmail}}

Thank you,

The {{studyName}} Team

**SMS Content:**
You have a survey to complete for {{studyName}}. Log in today: {{portalLink}}

—

## M3: Connect EHR

**Trigger**: EHR Sharing becomes available. 
**Timing**: 3 days after form becomes available AND participant still hasn't completed form  
**Subject**: Connect your Electronic Health Records  
**Template**: template-with-button  
**Type**: Marketing

**Email Header: Connect your Electronic Health Records**

**Email Content:**

Dear Participant,

This is a reminder to login to the {{studyName}} portal to connect your Electronic Health Records.

\[ LOG IN \]

If you have any questions about this process, please contact our study team by phone at {{studyTeamPhone}} or by email at {{studyTeamEmail}}

Thank you,

The {{studyName}} Team

**SMS Content:**
You can now connect your electronic health records for {{studyName}}. Log in today: {{portalLink}}

—

## M4: (Manual) Return to Portal

**Trigger**: Manual  
**Timing**: Manual  
**Subject**: [SUBJECT LINE]  
**Template**: template-with-button  
**Type**: Marketing  

**Email Header: [HEADER TEXT]**

**Email Content:**

Dear Participant,

[BODY COPY — describe the specific action you're asking participants to take and why it matters.]

\[ LOG IN \]

If you have any questions about this process, please contact our study team by phone at {{studyTeamPhone}} or by email at {{studyTeamEmail}}

Thank you,

The {{studyName}} Team

—
