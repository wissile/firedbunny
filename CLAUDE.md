# Working on FiredBunny

Live site: https://firedbunny.dosfirm.workers.dev (Cloudflare Worker `firedbunny`, deployed from `main`).

## Every change ships: commit, push, confirm the deploy

The owner wants every change committed to GitHub and deployed to Cloudflare, without being asked each time.

1. Make the change, run `python3 tools/build.py`, and run whatever tests cover it (`tools/sitetest.py`,
   `tools/harness.py`, or a quick Playwright check of the page you touched).
2. Commit with a plain message describing the change, ending with the attribution lines your session gives you.
3. Push to `main` (`git push origin main`). The push itself is the deploy: `.github/workflows/deploy.yml` builds the
   site and deploys it to the Cloudflare Worker `firedbunny`, then checks the live site.
4. Confirm the deploy instead of assuming it. The workflow's result shows up as a check run named
   "Deploy to Cloudflare" on the commit:

   ```bash
   sha=$(git rev-parse HEAD)
   gh api repos/wissile/firedbunny/commits/$sha/check-runs \
     --jq '.check_runs[] | {name, status, conclusion, id}'
   # when it has finished, its notes carry the live address, whether the live page matches this build,
   # and the /api/health verdict:
   gh api repos/wissile/firedbunny/check-runs/<id>/annotations --jq '.[] | .title + ": " + .message'
   ```

   A deploy takes a couple of minutes. If it fails, read the annotations, fix the cause, push again. Tell the owner
   once the change is live (or why it is not).
5. If the site changed, also republish the claude.ai copy: publish `build/fragment.html` to
   https://claude.ai/artifact/7uVtjsfYxpJJVkR1dm4jBE (it always shows sample data and the device voice).

Unfinished work goes on a branch, because only `main` deploys. Merge it into `main` when it is ready.

If lesson text changes, re-record its narration (`node tools/narration/make-scripts.js`, then
`tools/narration/render.py`, see README) and commit the new audio with the change.

## Things to keep in mind

- The deploy needs two GitHub repository secrets, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, which only the
  owner can add. A deploy that fails at "Check the Cloudflare secrets" means they are missing.
- Live earnings data needs `SEC_UA` set in the Cloudflare dashboard by the owner. Never put anyone's personal email
  in the repo or in a request.
- Use only one deploy route: this workflow. If Cloudflare's own Git integration (Workers Builds) is also connected,
  every push deploys twice.
- `public/audio/lessons/` holds about 280 MB of narration; Cloudflare uploads only files that changed.
