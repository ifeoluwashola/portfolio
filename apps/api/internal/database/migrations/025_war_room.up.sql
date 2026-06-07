-- 1. Add role to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student';

-- 2. Create threads table
CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Learning', 'Question', 'Debugging')),
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on category
CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(category);

-- Text search index on title
CREATE INDEX IF NOT EXISTS idx_threads_title_search ON threads USING gin(to_tsvector('english', title));

-- 3. Create replies table
CREATE TABLE IF NOT EXISTS replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_instructor_endorsed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on thread_id
CREATE INDEX IF NOT EXISTS idx_replies_thread_id ON replies(thread_id);

-- 4. Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('thread', 'reply')),
    entity_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, user_id, reaction_type)
);

-- Index on reactions
CREATE INDEX IF NOT EXISTS idx_reactions_entity ON reactions(entity_type, entity_id);
