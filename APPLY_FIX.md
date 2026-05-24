# Fix: GRE Word of the Day — automated email not sending

**Repo:** `feldmana332/gre-word-of-the-day`

## What was wrong
The daily GitHub Actions run reported "success" every day but never sent the
email. `main()` only sent when the local time was *exactly* 6 AM ET
(`now_local.hour == send_hour_local`). GitHub's scheduled crons run late
(30–60+ min) and are sometimes dropped, so the run landed at 7 AM ET — or the
6 AM cron was dropped entirely — and the script skipped. The only emails that
went out came from manually clicking "Run workflow".

## The fix — 3 small edits (do them on github.com from your laptop)

### 1. `word_of_the_day.py`
Open: https://github.com/feldmana332/gre-word-of-the-day/edit/main/word_of_the_day.py

Find this block (inside `main()`):

```python
    if args.trigger == "scheduled":
        if now_local.hour != int(config["send_hour_local"]):
            print(
                f"[skip] Scheduled run fired at {now_local.isoformat()} but send_hour_local={config['send_hour_local']}; not sending."
            )
            return 0
```

Replace it with:

```python
    if args.trigger == "scheduled":
        send_hour = int(config["send_hour_local"])
        # GitHub's scheduled crons are delayed (often 30-60+ min) and sometimes
        # dropped, so an exact `== send_hour` match misses the day whenever the
        # run lands late. Treat send_hour as the start of a morning send window;
        # the last_sent_date guard below still keeps it to one send per day.
        window_hours = int(config.get("send_window_hours", 4))
        if not (send_hour <= now_local.hour < send_hour + window_hours):
            print(
                f"[skip] Scheduled run fired at {now_local.isoformat()} "
                f"(local hour {now_local.hour}); outside send window "
                f"[{send_hour}, {send_hour + window_hours}). Not sending."
            )
            return 0
```

### 2. `.github/workflows/daily.yml`
Open: https://github.com/feldmana332/gre-word-of-the-day/edit/main/.github/workflows/daily.yml

Find:

```yaml
    - cron: "13 10,11 * * *"
```

Replace with (fires every 30 min across the morning so a dropped/late run no
longer skips the day):

```yaml
    - cron: "0,30 10,11,12 * * *"
```

### 3. `config.json` (optional but recommended)
Open: https://github.com/feldmana332/gre-word-of-the-day/edit/main/config.json

Add this line after `"send_hour_local": 6,`:

```json
  "send_window_hours": 4,
```

## Commit
Commit all three edits to the `main` branch. The next morning the scheduled run
will send on its own — and you can stop triggering it manually.

## How to verify it's working
- Tomorrow morning, check the **Actions** tab. The scheduled run should now end
  with `[send] To: ...` / `[ok] Sent.` in the log instead of `[skip] ...`.
- To test immediately: **Actions → Word of the Day → Run workflow** still works
  any time (manual runs were never affected by this bug).

---
Validated before delivery: the project's 35 tests still pass, and a simulated
7 AM ET scheduled run now sends instead of skipping.
