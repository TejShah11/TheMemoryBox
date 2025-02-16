-- Drop the existing table and recreate it with text[] type
DROP TABLE IF EXISTS capsules CASCADE;

CREATE TABLE capsules (
    id SERIAL PRIMARY KEY,
    albums text[] NOT NULL,
    unlock_time TIMESTAMP WITH TIME ZONE NOT NULL,
    theme VARCHAR(50) NOT NULL DEFAULT 'classic',
    reminders BOOLEAN NOT NULL DEFAULT false,
    reminderfreq VARCHAR(20) NOT NULL DEFAULT 'never',
    passwordtoggle BOOLEAN NOT NULL DEFAULT false,
    password VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
