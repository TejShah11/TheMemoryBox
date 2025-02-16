-- Drop existing capsules table if it exists
DROP TABLE IF EXISTS capsules;

-- Create capsules table with albums as text array
CREATE TABLE capsules (
    id SERIAL PRIMARY KEY,
    albums TEXT[] NOT NULL,
    unlock_time TIMESTAMP WITH TIME ZONE NOT NULL,
    theme VARCHAR(50) NOT NULL DEFAULT 'classic',
    reminders BOOLEAN NOT NULL DEFAULT false,
    reminderfreq VARCHAR(20) NOT NULL DEFAULT 'never',
    passwordtoggle BOOLEAN NOT NULL DEFAULT false,
    password VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
