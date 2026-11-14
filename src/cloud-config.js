/* FiredBunny accounts on the website (Supabase): the project's address and its publishable key.
 *
 * Both values are public by design: they ship inside every page. What keeps each person's data private is the
 * row-level security in supabase/schema.sql. Leave them empty and the website works as it always has (everything saved
 * in the browser, no sign-in). NEVER put the service_role / secret key or the database password here.
 *
 * url: Supabase → Project Settings → API Keys → Project URL, e.g. 'https://abcdxyz.supabase.co'
 * key: the publishable key ('sb_publishable_...'), or the "anon public" key on older projects
 */
window.SML.SUPABASE = { url: '', key: '' };
