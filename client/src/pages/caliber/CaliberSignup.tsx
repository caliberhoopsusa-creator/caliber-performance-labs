/**
 * Player sign up (pivot Section 4B).
 *
 * Defaults to the player role. Coach only appears when ENABLE_COACH_PRODUCT is
 * on, and the server enforces the same rule, so a hand crafted request cannot
 * claim a dark role either.
 *
 * Field order is fixed by the brief: position, class year, school, phone, date
 * of birth. Email and password follow because an account still needs them; they
 * are last so the five things a player actually cares about come first.
 *
 * Target is under twenty seconds on a phone, which is why there is one screen,
 * no stepper, and position is a tap rather than a dropdown.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { color, font, radius, DISPLAY_AXES } from "@/design/caliber/tokens";
import { parseDateOfBirth, isUnderMinimumAge } from "@shared/age";
import { featureFlags } from "@/lib/features";
import { BASKETBALL_POSITIONS } from "@shared/sports-config";
import { signupCopy } from "./landingCopy";

/* The five real positions, from shared/sports-config.ts. Migrated from the old
   Guard / Wing / Big buckets on 2026-09-25: players do not describe themselves
   in three broad groups. Ranking still cohorts on the broad group so tiers stay
   reachable on a small platform; only storage and display use the five. */
const POSITIONS = BASKETBALL_POSITIONS;

/** Four class years starting this year, which covers a high school roster. */
function classYears(): number[] {
  const thisYear = new Date().getFullYear();
  return [0, 1, 2, 3].map((n) => thisYear + n);
}

const display: React.CSSProperties = {
  fontFamily: font.display,
  fontWeight: DISPLAY_AXES.fontWeight,
  fontStretch: DISPLAY_AXES.fontStretch,
  letterSpacing: "-0.02em",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: color.fog,
  marginBottom: 6,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(245,241,232,0.05)",
  border: `1px solid ${color.chalkStrong}`,
  borderRadius: radius.soft,
  color: color.bone,
  fontSize: 16, // 16px or iOS zooms the page on focus.
  fontFamily: font.body,
  outline: "none",
};

const help: React.CSSProperties = { fontSize: 12, color: color.fog, marginTop: 6 };

export default function CaliberSignup() {
  const [, navigate] = useLocation();

  const [position, setPosition] = useState<string>("");
  const [classYear, setClassYear] = useState<string>("");
  const [school, setSchool] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* Age rule comes from shared/age.ts, the same module the server route uses,
     so the form and the API cannot drift. The server enforces it regardless. */
  const parsedDob = parseDateOfBirth(dateOfBirth);
  const under13 = Boolean(parsedDob && isUnderMinimumAge(parsedDob));
  const dobMissing = !parsedDob;

  const incomplete =
    !position || !classYear || !school.trim() || !phone.trim() || dobMissing ||
    !email.trim() || password.length < 8;

  const blocked = incomplete || under13 || busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;

    setBusy(true);
    setError(null);

    try {
      const register = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          dateOfBirth,
          referralCode: localStorage.getItem("caliber_ref") ?? undefined,
        }),
      });

      if (!register.ok) {
        const data = await register.json().catch(() => ({}));
        if (data.type === "guardian_consent_required") {
          setError(signupCopy.errors.under13);
        } else {
          setError(data.message || signupCopy.errors.generic);
        }
        return;
      }

      // Player is the default and the only role offered here.
      await fetch("/api/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: "player" }),
      });

      const profile = await fetch("/api/users/create-player-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: email.split("@")[0],
          sport: "basketball",
          position,
          graduationYear: Number(classYear),
          school: school.trim(),
          phone: phone.trim(),
          level: "high_school",
        }),
      });

      if (!profile.ok) {
        setError(signupCopy.errors.generic);
        return;
      }

      localStorage.removeItem("caliber_ref");

      /* The auth queries still hold the logged out answer, so the router would
         bounce straight back to the landing page. Refresh them before
         navigating, and await it so the redirect lands on an authenticated
         app rather than racing the refetch. */
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] }),
      ]);

      /* Came in from a teammate's claim link. Send them back to it rather than
         claiming silently on their behalf: they see the card again and press
         the button themselves, so taking over a profile stays a deliberate
         act (pivot Section 7). */
      const claimToken = localStorage.getItem("caliber_claim_token");
      if (claimToken) {
        localStorage.removeItem("caliber_claim_token");
        navigate(`/claim/${claimToken}`);
        return;
      }

      navigate("/grade-pending");
    } catch {
      setError(signupCopy.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: color.court,
        color: color.bone,
        fontFamily: font.body,
        padding: "32px 20px 64px",
      }}
    >
      <form
        onSubmit={submit}
        style={{ maxWidth: 380, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div>
          <h1 style={{ ...display, fontSize: 32, margin: "0 0 8px" }}>{signupCopy.heading}</h1>
          <p style={{ margin: 0, fontSize: 15, color: color.fog }}>{signupCopy.subhead}</p>
        </div>

        {/* 1. Position. Tap targets, not a dropdown: faster on a phone. */}
        <div>
          <span style={label}>{signupCopy.fields.position}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {POSITIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPosition(p)}
                aria-pressed={position === p}
                style={{
                  flex: "1 0 auto",
                  minWidth: 56,
                  minHeight: 44,
                  background: position === p ? color.bone : "transparent",
                  color: position === p ? color.ink : color.bone,
                  border: `1px solid ${position === p ? color.bone : color.chalkStrong}`,
                  borderRadius: radius.soft,
                  fontFamily: font.display,
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Class year. */}
        <div>
          <label style={label} htmlFor="classYear">{signupCopy.fields.classYear}</label>
          <select
            id="classYear"
            value={classYear}
            onChange={(e) => setClassYear(e.target.value)}
            style={{ ...input, minHeight: 44 }}
          >
            <option value="">Select</option>
            {classYears().map((y) => (
              <option key={y} value={y}>{`'${String(y).slice(-2)}`}</option>
            ))}
          </select>
        </div>

        {/* 3. School. */}
        <div>
          <label style={label} htmlFor="school">{signupCopy.fields.school}</label>
          <input
            id="school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            autoComplete="organization"
            style={input}
          />
        </div>

        {/* 4. Phone. */}
        <div>
          <label style={label} htmlFor="phone">{signupCopy.fields.phone}</label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={input}
          />
          <p style={help}>{signupCopy.fields.phoneHelp}</p>
        </div>

        {/* 5. Date of birth. */}
        <div>
          <label style={label} htmlFor="dob">{signupCopy.fields.dateOfBirth}</label>
          <input
            id="dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            style={input}
          />
          <p style={help}>{signupCopy.fields.dateOfBirthHelp}</p>
          {under13 && (
            <p role="alert" style={{ ...help, color: color.red }}>
              {signupCopy.errors.under13}
            </p>
          )}
        </div>

        <div>
          <label style={label} htmlFor="email">{signupCopy.fields.email}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />
        </div>

        <div>
          <label style={label} htmlFor="password">{signupCopy.fields.password}</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />
        </div>

        {error && (
          <p role="alert" style={{ margin: 0, fontSize: 14, color: color.red }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={blocked}
          style={{
            background: color.red,
            color: color.bone,
            border: "none",
            borderRadius: radius.pill,
            padding: "15px 24px",
            fontSize: 16,
            fontWeight: 600,
            fontFamily: font.body,
            cursor: blocked ? "not-allowed" : "pointer",
            opacity: blocked ? 0.55 : 1,
            minHeight: 48,
          }}
        >
          {busy ? "Creating your account" : signupCopy.submit}
        </button>

        {/* The coach route exists only while its product is on. */}
        {featureFlags.ENABLE_COACH_PRODUCT && (
          <Link href="/register?role=coach">
            <a style={{ fontSize: 13, color: color.fog, textAlign: "center" }}>
              {signupCopy.coachLink}
            </a>
          </Link>
        )}
      </form>
    </div>
  );
}
