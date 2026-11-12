#!/usr/bin/env python3
"""Write analytics/gtm-firedbunny.json: a Google Tag Manager container to import (Admin > Import container > Merge),
which sends every FiredBunny event to Google Analytics 4.

It holds:
  - a constant "FB - GA4 Measurement ID" (put your G-... ID there after importing),
  - a Google tag for that ID (automatic page views off: the site sends its own, one per page it shows),
  - one GA4 event tag that forwards each FiredBunny event under its own name with all its parameters,
  - a trigger matching the FiredBunny event names, and one Data Layer Variable per parameter.
Event names are read from the source (every SML.track('...') and the helper calls around it) and the parameters from
SML.trackKeys in src/core.js, so re-run this after adding events:  python3 tools/gtm_container.py
"""
import json, os, re, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')


def read(name):
    return open(os.path.join(SRC, name), encoding='utf-8').read()


def schema():
    core = read('core.js')
    keys = re.findall(r"'([a-z_]+)'", re.search(r'SML\.trackKeys = \[(.*?)\];', core, re.S).group(1))
    events = set()
    for f in sorted(os.listdir(SRC)):
        if not f.endswith('.js'):
            continue
        s = re.sub(r'/\*.*?\*/|//[^\n]*', '', read(f), flags=re.S)  # not the examples in comments
        events.update(re.findall(r"\bSML\.track\(\s*'([a-z][a-z0-9_]{2,39})'", s))
        # the small wrappers around SML.track in the audio player (T), the call player (CT) and the Offline page (DT)
        if f == 'mod-z-narration.js':
            events.update(re.findall(r"\bT\(\s*'([a-z][a-z0-9_]{2,39})'", s))
        if f == 'mod-z-rc-call.js':
            events.update(re.findall(r"\bCT\(\s*'([a-z][a-z0-9_]{2,39})'", s))
            events.update(x for pair in re.findall(r"\bCT\(st\.started \? '([a-z_]+)' : '([a-z_]+)'", s) for x in pair)
        if f == 'mod-z-offline.js' and 'DT({' in s:
            events.add('audio_download')
    return keys, sorted(events)


def P(t, k, v):
    return {'type': t, 'key': k, 'value': v}


def build():
    keys, events = schema()
    acc = {'accountId': '0', 'containerId': '0'}
    ids = iter(range(1, 1000))
    nxt = lambda: str(next(ids))
    variables = [dict(acc, variableId=nxt(), name='FB - GA4 Measurement ID', type='c', parameter=[P('TEMPLATE', 'value', 'G-XXXXXXXXXX')], fingerprint='0')]
    for k in keys:
        variables.append(dict(acc, variableId=nxt(), name='FB - dlv - ' + k, type='v', fingerprint='0', parameter=[
            P('INTEGER', 'dataLayerVersion', '2'), P('BOOLEAN', 'setDefaultValue', 'false'), P('TEMPLATE', 'name', k)]))
    trig_id = nxt()
    trigger = dict(acc, triggerId=trig_id, name='FB - FiredBunny events', type='CUSTOM_EVENT', fingerprint='0', customEventFilter=[{
        'type': 'MATCH_REGEX', 'parameter': [P('TEMPLATE', 'arg0', '{{_event}}'), P('TEMPLATE', 'arg1', '^(' + '|'.join(events) + ')$')]}])
    row = lambda name, value: {'type': 'MAP', 'map': [P('TEMPLATE', 'parameter', name), P('TEMPLATE', 'parameterValue', value)]}
    google_tag = dict(acc, tagId=nxt(), name='FB - Google tag (GA4)', type='googtag', fingerprint='0', parameter=[
        P('TEMPLATE', 'tagId', '{{FB - GA4 Measurement ID}}'),
        {'type': 'LIST', 'key': 'configSettingsTable', 'list': [row('send_page_view', 'false')]}],
        firingTriggerId=['2147479573'], tagFiringOption='ONCE_PER_EVENT', monitoringMetadata={'type': 'MAP'}, consentSettings={'consentStatus': 'NOT_SET'})
    event_tag = dict(acc, tagId=nxt(), name='FB - GA4 event (every FiredBunny event)', type='gaawe', fingerprint='0', parameter=[
        P('BOOLEAN', 'sendEcommerceData', 'false'),
        P('TEMPLATE', 'eventName', '{{Event}}'),
        P('TEMPLATE', 'measurementIdOverride', '{{FB - GA4 Measurement ID}}'),
        {'type': 'LIST', 'key': 'eventSettingsTable', 'list': [row(k, '{{FB - dlv - ' + k + '}}') for k in keys]}],
        firingTriggerId=[trig_id], tagFiringOption='ONCE_PER_EVENT', monitoringMetadata={'type': 'MAP'}, consentSettings={'consentStatus': 'NOT_SET'})
    return {
        'exportFormatVersion': 2,
        'exportTime': time.strftime('%Y-%m-%d %H:%M:%S'),
        'containerVersion': dict(acc, path='accounts/0/containers/0/versions/0', containerVersionId='0', fingerprint='0',
            container=dict(acc, path='accounts/0/containers/0', name='FiredBunny', publicId='GTM-PJR6KKW9', usageContext=['WEB'], fingerprint='0'),
            tag=[google_tag, event_tag], trigger=[trigger], variable=variables,
            builtInVariable=[dict(acc, type='EVENT', name='Event'), dict(acc, type='PAGE_URL', name='Page URL'), dict(acc, type='PAGE_PATH', name='Page Path')]),
    }, keys, events


if __name__ == '__main__':
    c, keys, events = build()
    out = os.path.join(ROOT, 'analytics', 'gtm-firedbunny.json')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(c, f, indent=2)
    print(f'{out}: {len(events)} events, {len(keys)} parameters')
    print('events:', ', '.join(events))
