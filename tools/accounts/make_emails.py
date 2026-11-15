#!/usr/bin/env python3
"""Write the Supabase email templates (supabase/email/*.html) in FiredBunny's look.

One layout, two emails: "Confirm signup" and "Reset password". Paste each file into Supabase → Authentication →
Email → Templates (the subject line is printed at the top of each file). Edit the wording here, run
`python3 tools/accounts/make_emails.py`, and commit the regenerated files.

Email clients are not browsers: layout is tables with inline styles, colours are repeated as bgcolor attributes for
Outlook, the logo is a PNG (public/email/fb-mark-144.png, served from firedbunny.com), and the site's fonts load only
where the client allows web fonts (Apple Mail, iOS); elsewhere the fallbacks are Arial Narrow / Arial. The heading
asks for weight 700 so the fallback is bold; Bebas Neue's single weight covers 100-900, so it is never fake-bolded.
"""
import html, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'supabase', 'email')

# the site's colours (src/style.css, src/brand.js)
BG, SURFACE, SURFACE2, LINE = '#0b0f19', '#111827', '#161f31', '#1f2a3d'
INK, TEXT, MUTED = '#e8edf5', '#c4cad5', '#8b95a8'
ACCENT, ON_ACC, FLAME, GOLD = '#e8ad4f', '#1a1206', '#ff6224', '#ffb52e'
SANS = "'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
MONO = "'IBM Plex Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace"
DISPLAY = "'Bebas Neue','Arial Narrow','Roboto Condensed',Arial,sans-serif"
FONTS = 'https://firedbunny.com/fonts/'
LOGO = 'https://firedbunny.com/email/fb-mark-144.png'

EMAILS = [
    dict(
        file='confirm-signup.html',
        subject='Confirm your FiredBunny account',
        preheader='One tap to confirm your email and finish creating your free FiredBunny account.',
        eyebrow='Confirm your email',
        title='Your progress, <em>everywhere.</em>',
        body=[
            'You’re one tap away from your free FiredBunny account. Confirm your email address and everything you '
            'save, from finished lessons and plans to your profile, follows you to every device where you sign in.',
        ],
        button='Confirm my email',
        link='{{ .SiteURL }}/signin/?token_hash={{ .TokenHash }}&type=email',
        tip=('Already learning as a guest? Once you’re signed in, FiredBunny offers to move what you saved in '
             'that browser into your new account.'),
        ignore=('Didn’t create a FiredBunny account? You can safely ignore this email. Without this link, the '
                'account is never activated.'),
        why='someone used it to create a FiredBunny account',
    ),
    dict(
        file='reset-password.html',
        subject='Reset your FiredBunny password',
        preheader='Choose a new password for your FiredBunny account.',
        eyebrow='Password reset',
        title='Choose a <em>new password.</em>',
        body=[
            'We received a request to reset the password for the FiredBunny account linked to '
            '<span style="color:%s;font-weight:600">{{ .Email }}</span>. Tap the button to choose a new one.' % INK,
        ],
        button='Choose a new password',
        link='{{ .SiteURL }}/signin/?token_hash={{ .TokenHash }}&type=recovery',
        tip='A few random words make a strong password. Long and memorable beats short and clever.',
        ignore=('Didn’t ask for this? You can ignore this email. Your password stays the same, and it can’t '
                'be changed without this link.'),
        why='someone asked to reset the password for it',
    ),
]


def page(e):
    title = e['title'].replace('<em>', f'<span style="color:{ACCENT}">').replace('</em>', '</span>')
    link_attr = e['link']  # Supabase's own examples keep a plain & in the href
    link_text = html.escape(e['link'], quote=False)
    paras = ''.join(
        f'<p style="margin:0 0 16px;font:400 16px/1.65 {SANS};color:{TEXT}">{p}</p>' for p in e['body'])
    return f'''<!-- Subject: {e['subject']} -->
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
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
  @font-face{{font-family:'IBM Plex Mono';font-weight:600;font-style:normal;src:url({FONTS}ibm-plex-mono-latin-600-normal.woff2) format('woff2')}}
  :root{{color-scheme:dark light;supported-color-schemes:dark light}}
  body{{margin:0;padding:0;width:100%!important;background:{BG}}}
  a{{color:{ACCENT}}}
  .fb-btn a:hover{{filter:brightness(1.08)}}
  @media (max-width:600px){{
    .fb-pad{{padding-left:22px!important;padding-right:22px!important}}
    .fb-title{{font-size:38px!important}}
  }}
</style>
</head>
<body style="margin:0;padding:0;background:{BG}" bgcolor="{BG}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:{BG};font-size:1px;line-height:1px">{e['preheader']}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{BG}" style="background:{BG}">
<tr><td align="center" style="padding:32px 12px 40px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">

    <!-- logo + wordmark, as in the site header -->
    <tr><td style="padding:0 4px 18px">
      <a href="{{{{ .SiteURL }}}}" style="text-decoration:none">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:10px;vertical-align:middle"><img src="{LOGO}" width="36" height="36" alt="" style="display:block;width:36px;height:36px;border:0"></td>
          <td style="vertical-align:middle;font:italic 700 21px/1 {SANS};letter-spacing:-0.02em;white-space:nowrap"><span style="color:{GOLD}">Fired</span><span style="color:{INK}">Bunny</span></td>
        </tr></table>
      </a>
    </td></tr>

    <!-- the card -->
    <tr><td bgcolor="{SURFACE}" style="background:{SURFACE};border:1px solid {LINE};border-radius:10px;overflow:hidden">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="4" bgcolor="{FLAME}" style="height:4px;line-height:4px;font-size:0;background:{FLAME};background-image:linear-gradient(90deg,{FLAME},{GOLD});border-radius:10px 10px 0 0">&nbsp;</td></tr>

        <!-- heading on graph paper -->
        <tr><td class="fb-pad" bgcolor="{SURFACE2}" style="padding:34px 36px 28px;background-color:{SURFACE2};background-image:linear-gradient(to right,rgba(232,237,245,.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(232,237,245,.05) 1px,transparent 1px);background-size:28px 28px;border-bottom:1px solid {LINE}">
          <p style="margin:0 0 14px;font:600 11px/1.3 {MONO};letter-spacing:0.22em;text-transform:uppercase;color:{ACCENT}">{e['eyebrow']}</p>
          <h1 class="fb-title" style="margin:0;font:700 46px/0.95 {DISPLAY};letter-spacing:0.005em;text-transform:uppercase;color:{INK}">{title}</h1>
        </td></tr>

        <tr><td class="fb-pad" style="padding:28px 36px 8px">
          {paras}
          <!-- button (a table cell, so Outlook draws it too) -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="fb-btn" style="margin:8px 0 26px">
            <tr><td align="center" bgcolor="{ACCENT}" style="border-radius:6px;background:{ACCENT}">
              <a href="{link_attr}" target="_blank" style="display:inline-block;padding:15px 28px;font:600 16px/1 {SANS};color:{ON_ACC};text-decoration:none;border-radius:6px">{e['button']} &rarr;</a>
            </td></tr>
          </table>

          <!-- bunny tip, as on the site -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#221d27" style="background:#221d27;border:1px solid #623b36;border-radius:6px">
            <tr>
              <td width="40" style="padding:14px 0 14px 14px;vertical-align:top"><img src="{LOGO}" width="28" height="28" alt="" style="display:block;width:28px;height:28px;border:0"></td>
              <td style="padding:14px 16px 14px 12px;vertical-align:top">
                <p style="margin:0 0 4px;font:600 11px/1.3 {MONO};letter-spacing:0.18em;text-transform:uppercase;color:{FLAME}">Bunny tip</p>
                <p style="margin:0;font:400 14.5px/1.55 {SANS};color:{INK}">{e['tip']}</p>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 6px;font:400 13px/1.5 {SANS};color:{MUTED}">Button not working? Copy this link into your browser:</p>
          <p style="margin:0 0 26px;font:400 12px/1.5 {MONO};word-break:break-all"><a href="{link_attr}" target="_blank" style="color:{ACCENT};text-decoration:underline">{link_text}</a></p>
        </td></tr>

        <tr><td class="fb-pad" style="padding:20px 36px 26px;border-top:1px solid {LINE}">
          <p style="margin:0;font:400 13px/1.6 {SANS};color:{MUTED}">{e['ignore']}</p>
        </td></tr>
      </table>
    </td></tr>

    <!-- footer -->
    <tr><td align="center" style="padding:24px 16px 0">
      <p style="margin:0 0 6px;font:italic 700 14px/1 {SANS};letter-spacing:-0.02em"><a href="{{{{ .SiteURL }}}}" style="text-decoration:none"><span style="color:{GOLD}">Fired</span><span style="color:{INK}">Bunny</span></a></p>
      <p style="margin:0 0 10px;font:400 12px/1.6 {SANS};color:{MUTED}">Money lessons, shared free.</p>
      <p style="margin:0;font:400 11px/1.6 {SANS};color:#5d6779">Sent to {{{{ .Email }}}} because {e['why']} on <a href="{{{{ .SiteURL }}}}" style="color:#5d6779;text-decoration:underline">firedbunny.com</a>.</p>
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
