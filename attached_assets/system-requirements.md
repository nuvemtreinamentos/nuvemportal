# Educational Platform System Requirements

## Overview
Create a web application for an educational platform that offers English and Python Programming courses, with AI-powered tutors and a structured learning progression system.

## Database Schema

### Courses Table
```sql
CREATE TABLE Courses (
    UID uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    status boolean NOT NULL DEFAULT true
);
```

### CoursePrompt Table
```sql
CREATE TABLE CoursePrompt (
    UID uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    CourseID uuid REFERENCES Courses(UID),
    prompt text NOT NULL,
    sequence integer NOT NULL,
    UNIQUE (CourseID, sequence)
);
```

### Context Table
```sql
CREATE TABLE Context (
    UID uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    CoursePromptID uuid REFERENCES CoursePrompt(UID),
    Ack boolean NOT NULL DEFAULT false,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);
```

### Tutors Table
```sql
CREATE TABLE Tutors (
    UID uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    style text NOT NULL,
    status boolean NOT NULL DEFAULT true,
    profilepic bytea
);
```

## User Flow Requirements

1. Course Selection View
   - Create an intuitive interface showing two initial options:
     - English Course
     - Python Programming
   - Display course options from the Courses table
   - Enable future expansion for additional courses

2. Progress Tracking System
   - When a student selects a course:
     - Create a new Context record
     - Use sequence 1 from CoursePrompt
     - Link to the selected course

3. Tutor Selection Interface
   - First prompt (sequence 1) should present available tutors
   - For each tutor, display:
     - Profile picture
     - Name
     - Introduction (audio conversion of prompt)
   - Enable tutor selection

4. Progression Logic
   - After each student interaction:
     - Update Context.Ack to true for current prompt
     - Identify next sequence in CoursePrompt
     - Create new Context record
     - Submit next prompt to LLM

## Technical Requirements

1. Database Features
   - Use UUIDs (GUID) for all primary keys
   - Implement proper foreign key relationships
   - Include timestamps for tracking

2. Audio Capabilities
   - Text-to-speech conversion for prompts
   - Audio playback functionality

3. Image Handling
   - Store and retrieve tutor profile pictures
   - Proper bytea handling for images

4. State Management
   - Track current student progress
   - Maintain session context
   - Handle course progression

## Implementation Notes

1. Database Initialization
   ```sql
   -- Initial course data
   INSERT INTO Courses (name, status) VALUES
   ('English Course', true),
   ('Python Programming', true);

   -- Sample course prompts
   INSERT INTO CoursePrompt (CourseID, prompt, sequence) VALUES
   ((SELECT UID FROM Courses WHERE name = 'English Course'), 
    'Welcome! Please select your preferred tutor who will guide you through the English course.', 1);
   ```

2. Error Handling
   - Validate course selection
   - Ensure proper sequence progression
   - Handle missing or invalid data

3. Performance Considerations
   - Index frequently queried columns
   - Optimize image storage and retrieval
   - Cache common queries
