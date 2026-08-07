-- Run this in Supabase SQL Editor.
-- Removes the schematic/.bbmodel preview feature entirely, per a decision not to
-- risk any copyright exposure around rendering Minecraft-adjacent file formats.

alter table public.products drop column if exists schematic_path;
