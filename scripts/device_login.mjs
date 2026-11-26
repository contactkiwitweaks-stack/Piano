import fs from 'fs';
import { execSync } from 'child_process';

const clientId = '178c6fc778ccc68e1d6a';

async function requestDeviceCode() {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'GitHub-CLI',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `client_id=${clientId}&scope=repo%20workflow`,
  });

  const data = await res.json();
  if (!data.device_code) {
    throw new Error('Failed to get device code: ' + JSON.stringify(data));
  }
  return data;
}

async function pollForToken(device_code, interval = 5, expires_in = 899) {
  let pollInterval = interval;
  const deadline = Date.now() + expires_in * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval * 1000));

    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'GitHub-CLI',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `client_id=${clientId}&device_code=${device_code}&grant_type=urn:ietf:params:oauth:grant-type:device_code`,
      });

      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        return tokenData.access_token;
      }

      if (tokenData.error === 'authorization_pending') {
        process.stdout.write('.');
        continue;
      }

      if (tokenData.error === 'slow_down') {
        pollInterval += 5;
        console.log('\n[Slow Down] Polling interval increased to ' + pollInterval + 's');
        continue;
      }

      if (tokenData.error === 'expired_token') {
        console.log('\n[Expired] Device code expired, requesting new code...');
        return null;
      }

      if (tokenData.error) {
        console.error('\nAuth error:', tokenData.error, tokenData.error_description);
        return null;
      }
    } catch (err) {
      console.warn('\nPolling network warning:', err.message);
    }
  }
  return null;
}

async function main() {
  console.log('Starting GitHub Device Login loop...');

  while (true) {
    try {
      const { device_code, user_code, verification_uri, interval, expires_in } = await requestDeviceCode();
      console.log('\n======================================================');
      console.log(`1. Open: ${verification_uri}`);
      console.log(`2. Enter Code: ${user_code}`);
      console.log('======================================================\n');

      fs.writeFileSync(
        'scripts/github_auth_state.json',
        JSON.stringify(
          {
            user_code,
            verification_uri,
            device_code,
            requested_at: new Date().toISOString(),
            expires_at: Date.now() + expires_in * 1000,
          },
          null,
          2
        )
      );

      const token = await pollForToken(device_code, interval, expires_in);
      if (token) {
        console.log('\n>>> AUTHORIZATION SUCCESSFUL! <<<');
        fs.writeFileSync('scripts/github_token.json', JSON.stringify({ token, updated_at: new Date().toISOString() }, null, 2));

        // Push to origin/main
        console.log('Pushing to GitHub origin/main...');
        execSync(`git push https://${token}@github.com/contactkiwitweaks-stack/Piano.git main`, {
          stdio: 'inherit',
        });
        console.log('Git push completed successfully!');

        // Launch poll and download
        console.log('Tracking iOS IPA build on GitHub Actions...');
        execSync('node scripts/poll_and_download.mjs', {
          stdio: 'inherit',
          env: { ...process.env, GITHUB_TOKEN: token },
        });

        console.log('All done! IPA is ready.');
        process.exit(0);
      }
    } catch (e) {
      console.error('Error in login loop:', e.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main().catch(console.error);
