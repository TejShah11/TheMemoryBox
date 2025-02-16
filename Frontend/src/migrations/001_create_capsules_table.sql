-- Drop existing capsules table if it exists
DROP TABLE IF EXISTS capsules;

-- Create capsules table with correct data types
CREATE TABLE capsules (
    id SERIAL PRIMARY KEY,
    albums VARCHAR(255) NOT NULL,
    unlock_time TIMESTAMP WITH TIME ZONE NOT NULL,
    theme VARCHAR(50) NOT NULL DEFAULT 'classic',
    reminders BOOLEAN NOT NULL DEFAULT false,
    reminderfreq VARCHAR(20) NOT NULL DEFAULT 'never',
    passwordtoggle BOOLEAN NOT NULL DEFAULT false,
    password VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (albums) REFERENCES albums(id) ON DELETE CASCADE
);
