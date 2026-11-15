#!/usr/bin/env python3
"""Write the Supabase email templates (supabase/email/*.html) in FiredBunny's look.

One layout, two emails: "Confirm signup" and "Reset password". Paste each file into Supabase → Authentication →
Email → Templates (the subject line is noted in each file's <head>). Edit the wording here, run
`python3 tools/accounts/make_emails.py`, and commit the regenerated files.

Kept deliberately simple (the owner asked for less): logo and wordmark, then one card with the flame-to-gold top line,
a heading, one short paragraph, the amber button and a quiet note; one footer line.

Email clients are not browsers: layout is tables with inline styles, colours are repeated as bgcolor attributes for
Outlook, the logo is a PNG (public/email/fb-mark-144.png, served from firedbunny.com), and the site's fonts (copies in
public/email/fonts/, served with Access-Control-Allow-Origin) load only where the client allows web fonts (Apple Mail,
iOS); elsewhere the fallbacks are Arial Narrow / Arial. The heading asks for weight 700 so the fallback is bold; Bebas
Neue's single weight covers 100-900, so it is never fake-bolded.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'supabase', 'email')

# the site's colours (src/style.css, src/brand.js)
BG, SURFACE, LINE = '#0b0f19', '#111827', '#1f2a3d'
INK, TEXT, MUTED, FAINT = '#e8edf5', '#c4cad5', '#8b95a8', '#5d6779'
ACCENT, ON_ACC, FLAME, GOLD = '#e8ad4f', '#1a1206', '#ff6224', '#ffb52e'
SANS = "'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
DISPLAY = "'Bebas Neue','Arial Narrow','Roboto Condensed',Arial,sans-serif"
FONTS = 'https://firedbunny.com/email/fonts/'  # copies of the site's fonts, served with CORS (public/_headers)
LOGO = 'https://firedbunny.com/email/fb-mark-144.png'

EMAILS = [
    dict(
        file='confirm-signup.html',
        subject='Confirm your FiredBunny account',
        preheader='One tap to finish creating your free FiredBunny account.',
        title='Confirm your <em>email.</em>',
        body='One tap and your free FiredBunny account is ready. Everything you save follows you to every device '
             'where you sign in.',
        button='Confirm my email',
        link='{{ .SiteURL }}/signin/?token_hash={{ .TokenHash }}&type=email',
        note='Didn’t create an account? You can ignore this email.',
    ),
    dict(
        file='reset-password.html',
        subject='Reset your FiredBunny password',
        preheader='Choose a new password for your FiredBunny account.',
        title='Choose a <em>new password.</em>',
        body='We got a request to reset the password for <span style="color:%s">{{ .Email }}</span>. '
             'Tap the button to choose a new one.' % INK,
        button='Choose a new password',
        link='{{ .SiteURL }}/signin/?token_hash={{ .TokenHash }}&type=recovery',
        note='Didn’t ask for this? Ignore this email and your password stays the same.',
    ),
]


def page(e):
    title = e['title'].replace('<em>', f'<span style="color:{ACCENT}">').replace('</em>', '</span>')
    link = e['link']  # Supabase's own examples keep a plain & in the href
    return f'''<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<!-- Supabase subject line: {e['subject']} -->
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>{e['subject']}</title>
<style>
  @font-face{{font-family:'Bebas Neue';font-weight:100 900;font-style:normal;src:url({FONTS}bebas-neue-latin-400-normal.woff2) format('woff2')}}
  @font-face{{font-family:'IBM Plex Sans';font-weight:400;font-style:normal;src:url({FONTS}ibm-plex-sans-latin-400-normal.woff2) format('woff2')}}
  @font-face{{font-family:'IBM Plex Sans';font-weight:600;font-style:normal;src:url({FONTS}ibm-plex-sans-latin-600-normal.woff2) format('woff2')}}
  @font-face{{font-family:'IBM Plex Sans';font-weight:700;font-style:italic;src:url({FONTS}ibm-plex-sans-latin-700-italic.woff2) format('woff2')}}
  :root{{color-scheme:dark light;supported-color-schemes:dark light}}
  body{{margin:0;padding:0;width:100%!important;background:{BG}}}
  @media (max-width:600px){{.fb-pad{{padding:30px 24px!important}}.fb-title{{font-size:36px!important}}}}
</style>
</head>
<body style="margin:0;padding:0;background:{BG}" bgcolor="{BG}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:{BG};font-size:1px;line-height:1px">{e['preheader']}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{BG}" style="background:{BG}">
<tr><td align="center" style="padding:36px 12px 40px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">

    <tr><td style="padding:0 4px 18px">
      <a href="{{{{ .SiteURL }}}}" style="text-decoration:none">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:10px;vertical-align:middle"><img src="{LOGO}" width="34" height="34" alt="" style="display:block;width:34px;height:34px;border:0"></td>
          <td style="vertical-align:middle;font:italic 700 20px/1 {SANS};letter-spacing:-0.02em;white-space:nowrap"><span style="color:{GOLD}">Fired</span><span style="color:{INK}">Bunny</span></td>
        </tr></table>
      </a>
    </td></tr>

    <tr><td bgcolor="{SURFACE}" style="background:{SURFACE};border:1px solid {LINE};border-radius:10px;overflow:hidden">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="3" bgcolor="{FLAME}" style="height:3px;line-height:3px;font-size:0;background:{FLAME};background-image:linear-gradient(90deg,{FLAME},{GOLD});border-radius:10px 10px 0 0">&nbsp;</td></tr>
        <tr><td class="fb-pad" style="padding:38px 40px 36px">
          <h1 class="fb-title" style="margin:0 0 18px;font:700 42px/0.95 {DISPLAY};letter-spacing:0.005em;text-transform:uppercase;color:{INK}">{title}</h1>
          <p style="margin:0 0 28px;font:400 16px/1.65 {SANS};color:{TEXT}">{e['body']}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" bgcolor="{ACCENT}" style="border-radius:6px;background:{ACCENT}">
              <a href="{link}" target="_blank" style="display:inline-block;padding:15px 28px;font:600 16px/1 {SANS};color:{ON_ACC};text-decoration:none;border-radius:6px">{e['button']}</a>
            </td></tr>
          </table>
          <p style="margin:28px 0 0;font:400 13px/1.6 {SANS};color:{MUTED}">{e['note']} Button not working? <a href="{link}" target="_blank" style="color:{ACCENT};text-decoration:underline">Use this link</a>.</p>
        </td></tr>
      </table>
    </td></tr>

    <tr><td align="center" style="padding:22px 16px 0">
      <p style="margin:0;font:400 12px/1.6 {SANS};color:{FAINT}">Sent to {{{{ .Email }}}} by <a href="{{{{ .SiteURL }}}}" style="color:{FAINT};text-decoration:underline">FiredBunny</a> &middot; Money lessons, shared free.</p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>
'''


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for e in EMAILS:
        path = os.path.join(OUT, e['file'])
        with open(path, 'w') as f:
            f.write(page(e))
        print('wrote', os.path.relpath(path, ROOT), '| subject:', e['subject'])
