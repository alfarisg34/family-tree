-- ==============================================================================
-- SUPABASE DATABASE SCHEMA FOR INTERACTIVE FAMILY TREE
-- Jalankan script SQL ini di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Script ini bersifat IDEMPOTEN (Aman dijalankan berkali-kali tanpa error)
-- ==============================================================================

-- 1. Buat Tabel Family Trees
CREATE TABLE IF NOT EXISTS public.family_trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_name TEXT NOT NULL DEFAULT 'Bani Sastrowardoyo & Siti Aminah',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Buat Tabel Family Members
CREATE TABLE IF NOT EXISTS public.family_members (
    id TEXT PRIMARY KEY,
    tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    nickname TEXT,
    title TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')) DEFAULT 'male',
    generation INTEGER NOT NULL DEFAULT 1,
    birth_date TEXT,
    birth_place TEXT,
    is_deceased BOOLEAN DEFAULT false,
    passed_date TEXT,
    passed_place TEXT,
    burial_place TEXT,
    education TEXT,
    occupation TEXT,
    workplace TEXT,
    residence TEXT,
    phone TEXT,
    email TEXT,
    bio TEXT,
    avatar TEXT,
    thumbnail TEXT,
    gallery JSONB DEFAULT '[]'::jsonb,
    parent_ids JSONB DEFAULT '[]'::jsonb,
    relationship_to_parents TEXT DEFAULT 'biological',
    spouses JSONB DEFAULT '[]'::jsonb,
    order_num INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indeks untuk Query Cepat
CREATE INDEX IF NOT EXISTS idx_family_members_tree_id ON public.family_members(tree_id);
CREATE INDEX IF NOT EXISTS idx_family_members_generation ON public.family_members(generation);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.family_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies jika sudah ada sebelumnya agar tidak terjadi error duplicate
DROP POLICY IF EXISTS "Allow public read access on family_trees" ON public.family_trees;
DROP POLICY IF EXISTS "Allow public insert/update on family_trees" ON public.family_trees;
DROP POLICY IF EXISTS "Allow public read access on family_members" ON public.family_members;
DROP POLICY IF EXISTS "Allow public insert/update/delete on family_members" ON public.family_members;

-- Buat ulang policies untuk family_trees
CREATE POLICY "Allow public read access on family_trees"
ON public.family_trees
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert/update on family_trees"
ON public.family_trees
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Buat ulang policies untuk family_members
CREATE POLICY "Allow public read access on family_members"
ON public.family_members
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert/update/delete on family_members"
ON public.family_members
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 6. Setup Supabase Storage Bucket untuk Foto Keluarga
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-photos', 'family-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies jika sudah ada
DROP POLICY IF EXISTS "Allow public read family photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert family photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update family photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete family photos" ON storage.objects;

-- Buat ulang storage policies
CREATE POLICY "Allow public read family photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'family-photos');

CREATE POLICY "Allow public insert family photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'family-photos');

CREATE POLICY "Allow public update family photos"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'family-photos');

CREATE POLICY "Allow public delete family photos"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'family-photos');
