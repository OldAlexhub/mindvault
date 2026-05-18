#!/usr/bin/env python3
"""
MindVault Release Automation Script
Developer: Old Alex Hub

Usage:
    python release.py                 Full build (check env, sign, build APK + AAB, copy artifacts, summary)
    python release.py --skip-build    Skip Gradle build, just copy artifacts and store assets
    python release.py --check-env     Print environment check and exit
    python release.py --generate-key-only  Generate signing keystore only, then exit
    python release.py --clean         Clean Gradle before build
    python release.py --no-clean      Skip Gradle clean before build

Python standard library only. No pip installs required.
"""

import argparse
import os
import platform
import random
import shutil
import string
import subprocess
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

APP_VERSION = "1.0.0"
KEYSTORE_ALIAS = "mindvault-key"
KEYSTORE_RELATIVE = os.path.join("android", "keystore", "mindvault-release.keystore")
KEYSTORE_PROPS_RELATIVE = os.path.join("android", "keystore", "keystore.properties")
LOCAL_PROPS_RELATIVE = os.path.join("android", "local.properties")
ADMOB_CONFIG_RELATIVE = os.path.join("src", "config", "admob.ts")
STORE_ASSETS_RELATIVE = "store_assets"

RELEASES_BUILDS_RELATIVE = os.path.join("..", "releases", "builds", f"v{APP_VERSION}")
RELEASES_STORE_ASSETS_RELATIVE = os.path.join("..", "releases", "store-assets")
RELEASES_DOCS_RELATIVE = os.path.join("..", "releases", "docs")

APP_ADS_TXT_LINE = "google.com, pub-7831002909037560, DIRECT, f08c47fec0942fa0"

IS_WINDOWS = sys.platform.startswith("win") or os.name == "nt"

SEPARATOR = "-" * 70


# ---------------------------------------------------------------------------
# Argument Parsing
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="MindVault release automation script."
    )
    parser.add_argument(
        "--skip-build",
        action="store_true",
        help="Skip Gradle build; copy existing artifacts and store assets only.",
    )
    parser.add_argument(
        "--check-env",
        action="store_true",
        help="Print environment check and exit.",
    )
    parser.add_argument(
        "--generate-key-only",
        action="store_true",
        help="Generate the signing keystore only, then exit.",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Run Gradle clean before building.",
    )
    parser.add_argument(
        "--no-clean",
        action="store_true",
        help="Skip Gradle clean before building.",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def print_header(title):
    print()
    print(SEPARATOR)
    print(f"  {title}")
    print(SEPARATOR)


def print_ok(label, value=""):
    tag = "[OK]"
    if value:
        print(f"  {tag}  {label}: {value}")
    else:
        print(f"  {tag}  {label}")


def print_warn(label, value=""):
    tag = "[WARN]"
    if value:
        print(f"  {tag} {label}: {value}")
    else:
        print(f"  {tag} {label}")


def print_fail(label, value=""):
    tag = "[FAIL]"
    if value:
        print(f"  {tag} {label}: {value}")
    else:
        print(f"  {tag} {label}")


def fail(message):
    print()
    print(f"  ERROR: {message}")
    print()
    sys.exit(1)


def generate_strong_password(length=32):
    """Generate a strong random password using standard library."""
    try:
        import secrets as _secrets
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return "".join(_secrets.choice(alphabet) for _ in range(length))
    except ImportError:
        rng = random.SystemRandom()
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return "".join(rng.choice(alphabet) for _ in range(length))


def windows_path_to_forward_slash(path_str):
    """Convert Windows backslashes to forward slashes for sdk.dir in local.properties."""
    return str(path_str).replace("\\", "/")


# ---------------------------------------------------------------------------
# Phase 1: Locate project
# ---------------------------------------------------------------------------

def locate_project():
    """
    Find the mindvault/ project directory.
    Tries the current directory, then looks for mindvault/ as a subdirectory.
    """
    print_header("Locating Project Directory")

    cwd = Path.cwd()

    # Check if we are already in the mindvault project dir
    if (cwd / "android").is_dir() and (cwd / "package.json").is_file():
        print_ok("Project directory", str(cwd))
        return cwd

    # Check subdirectory named mindvault
    candidate = cwd / "mindvault"
    if candidate.is_dir() and (candidate / "android").is_dir() and (candidate / "package.json").is_file():
        print_ok("Project directory", str(candidate))
        return candidate

    # Check parent directory
    parent = cwd.parent
    candidate_parent = parent / "mindvault"
    if candidate_parent.is_dir() and (candidate_parent / "android").is_dir() and (candidate_parent / "package.json").is_file():
        print_ok("Project directory", str(candidate_parent))
        return candidate_parent

    fail(
        "Could not locate the MindVault project directory.\n"
        "  Run this script from the mindvault/ directory or its parent."
    )


# ---------------------------------------------------------------------------
# Phase 2: Find Java / JAVA_HOME
# ---------------------------------------------------------------------------

def check_java(project_dir):
    """
    Find JAVA_HOME. Check environment variable first, then common Android Studio locations.
    Returns (java_home_path, keytool_path).
    """
    print_header("Checking Java / JAVA_HOME")

    keytool_name = "keytool.exe" if IS_WINDOWS else "keytool"

    def keytool_in(java_home):
        kt = Path(java_home) / "bin" / keytool_name
        return kt if kt.is_file() else None

    def try_java_home(path, source):
        p = Path(path)
        if p.is_dir():
            kt = keytool_in(p)
            if kt:
                print_ok(f"JAVA_HOME ({source})", str(p))
                return p, kt
            # Try jbr/Contents/Home subdirectory (macOS style inside a non-mac path)
            for sub in ["jbr/Contents/Home", "jre", "jbr"]:
                alt = p / sub
                if alt.is_dir():
                    kt2 = keytool_in(alt)
                    if kt2:
                        print_ok(f"JAVA_HOME ({source}/{sub})", str(alt))
                        return alt, kt2
        return None, None

    # 1. Environment variable
    env_java = os.environ.get("JAVA_HOME", "")
    if env_java:
        jh, kt = try_java_home(env_java, "JAVA_HOME env")
        if jh:
            _apply_java_home(jh)
            return jh, kt

    # 2. Android Studio bundled JDK locations
    candidates = []

    if IS_WINDOWS:
        localappdata = os.environ.get("LOCALAPPDATA", "")
        candidates += [
            (r"C:\Program Files\Android\Android Studio\jbr", "Android Studio jbr (Program Files)"),
            (r"C:\Program Files\Android\Android Studio\jre", "Android Studio jre (Program Files)"),
        ]
        if localappdata:
            candidates += [
                (os.path.join(localappdata, "Programs", "Android Studio", "jbr"),
                 "Android Studio jbr (LocalAppData)"),
                (os.path.join(localappdata, "Programs", "Android Studio", "jre"),
                 "Android Studio jre (LocalAppData)"),
            ]
        # Also check Program Files (x86)
        candidates += [
            (r"C:\Program Files (x86)\Android\Android Studio\jbr", "Android Studio jbr (x86)"),
        ]
        # Check common JDK installs
        for jdk_ver in ["17", "11", "21", "8"]:
            candidates += [
                (rf"C:\Program Files\Eclipse Adoptium\jdk-{jdk_ver}", f"Eclipse Adoptium JDK {jdk_ver}"),
                (rf"C:\Program Files\Microsoft\jdk-{jdk_ver}", f"Microsoft JDK {jdk_ver}"),
                (rf"C:\Program Files\Java\jdk-{jdk_ver}", f"Oracle JDK {jdk_ver}"),
            ]
    elif sys.platform == "darwin":
        candidates += [
            ("/Applications/Android Studio.app/Contents/jbr/Contents/Home",
             "Android Studio jbr (macOS)"),
            ("/Applications/Android Studio.app/Contents/jre/Contents/Home",
             "Android Studio jre (macOS)"),
        ]
        # /usr/libexec/java_home output
        try:
            result = subprocess.run(
                ["/usr/libexec/java_home"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0 and result.stdout.strip():
                candidates.insert(0, (result.stdout.strip(), "java_home utility"))
        except Exception:
            pass
    else:
        home = Path.home()
        candidates += [
            (str(home / "android-studio" / "jbr"), "Android Studio jbr (Linux home)"),
            (str(home / "android-studio" / "jre"), "Android Studio jre (Linux home)"),
            ("/opt/android-studio/jbr", "Android Studio jbr (Linux opt)"),
        ]
        # Check java in PATH
        try:
            result = subprocess.run(
                ["which", "java"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0 and result.stdout.strip():
                java_bin = Path(result.stdout.strip()).resolve()
                java_home_guess = java_bin.parent.parent
                candidates.insert(0, (str(java_home_guess), "java in PATH"))
        except Exception:
            pass

    for path, source in candidates:
        jh, kt = try_java_home(path, source)
        if jh:
            _apply_java_home(jh)
            return jh, kt

    fail(
        "Could not find Java / JAVA_HOME.\n"
        "  Install Android Studio (which bundles a JDK) or set the JAVA_HOME environment variable.\n"
        "  Android Studio default JBR location (Windows): "
        "C:\\Program Files\\Android\\Android Studio\\jbr"
    )


def _apply_java_home(java_home):
    """Set JAVA_HOME env var and add JAVA_HOME/bin to PATH for this process."""
    os.environ["JAVA_HOME"] = str(java_home)
    java_bin = str(Path(java_home) / "bin")
    current_path = os.environ.get("PATH", "")
    if java_bin not in current_path:
        os.environ["PATH"] = java_bin + os.pathsep + current_path


# ---------------------------------------------------------------------------
# Phase 3: Find Android SDK
# ---------------------------------------------------------------------------

def check_android_sdk(project_dir):
    """
    Find the Android SDK directory.
    Checks env vars, local.properties, and common install paths.
    Returns sdk_dir path string.
    """
    print_header("Checking Android SDK")

    def validate_sdk(sdk_path):
        p = Path(sdk_path)
        if not p.is_dir():
            return False
        adb = p / "platform-tools" / ("adb.exe" if IS_WINDOWS else "adb")
        return adb.is_file()

    def adb_path(sdk_path):
        return str(Path(sdk_path) / "platform-tools" / ("adb.exe" if IS_WINDOWS else "adb"))

    # 1. Environment variables
    for env_key in ["ANDROID_HOME", "ANDROID_SDK_ROOT"]:
        val = os.environ.get(env_key, "")
        if val and validate_sdk(val):
            print_ok(f"Android SDK ({env_key})", val)
            _apply_sdk(val)
            _write_local_properties(project_dir, val)
            return val

    # 2. Read android/local.properties
    local_props = project_dir / LOCAL_PROPS_RELATIVE
    if local_props.is_file():
        sdk_from_props = _read_sdk_dir_from_local_properties(local_props)
        if sdk_from_props and validate_sdk(sdk_from_props):
            print_ok("Android SDK (local.properties)", sdk_from_props)
            _apply_sdk(sdk_from_props)
            _write_local_properties(project_dir, sdk_from_props)
            return sdk_from_props

    # 3. Common install locations
    candidates = []

    if IS_WINDOWS:
        localappdata = os.environ.get("LOCALAPPDATA", "")
        userprofile = os.environ.get("USERPROFILE", "")
        if localappdata:
            candidates.append(os.path.join(localappdata, "Android", "Sdk"))
        if userprofile:
            candidates.append(os.path.join(userprofile, "AppData", "Local", "Android", "Sdk"))
    elif sys.platform == "darwin":
        home = Path.home()
        candidates.append(str(home / "Library" / "Android" / "sdk"))
    else:
        home = Path.home()
        candidates.append(str(home / "Android" / "Sdk"))
        candidates.append(str(home / "android" / "sdk"))

    for cand in candidates:
        if validate_sdk(cand):
            print_ok("Android SDK (common location)", cand)
            _apply_sdk(cand)
            _write_local_properties(project_dir, cand)
            return cand

    fail(
        "Could not find the Android SDK.\n"
        "  Set the ANDROID_HOME environment variable, or install Android Studio\n"
        "  and accept the default SDK install location.\n"
        "  Common Windows location: %LOCALAPPDATA%\\Android\\Sdk"
    )


def _apply_sdk(sdk_dir):
    os.environ["ANDROID_HOME"] = sdk_dir
    os.environ["ANDROID_SDK_ROOT"] = sdk_dir
    platform_tools = str(Path(sdk_dir) / "platform-tools")
    current_path = os.environ.get("PATH", "")
    if platform_tools not in current_path:
        os.environ["PATH"] = platform_tools + os.pathsep + current_path


def _read_sdk_dir_from_local_properties(local_props_path):
    try:
        with open(local_props_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("sdk.dir="):
                    return line[len("sdk.dir="):].strip().replace("\\\\", "\\")
    except Exception:
        pass
    return ""


def _write_local_properties(project_dir, sdk_dir):
    """Write android/local.properties with sdk.dir, preserving other lines."""
    local_props = project_dir / LOCAL_PROPS_RELATIVE
    sdk_line = f"sdk.dir={windows_path_to_forward_slash(sdk_dir)}\n"

    existing_lines = []
    if local_props.is_file():
        try:
            with open(local_props, "r", encoding="utf-8") as f:
                existing_lines = f.readlines()
        except Exception:
            existing_lines = []

    # Remove any existing sdk.dir lines
    filtered = [ln for ln in existing_lines if not ln.strip().startswith("sdk.dir=")]

    # Ensure parent dir exists
    local_props.parent.mkdir(parents=True, exist_ok=True)

    with open(local_props, "w", encoding="utf-8") as f:
        f.write(sdk_line)
        for ln in filtered:
            f.write(ln)

    print_ok("local.properties written", str(local_props))


# ---------------------------------------------------------------------------
# Phase 4: Prepare Signing
# ---------------------------------------------------------------------------

def prepare_signing(project_dir, keytool_path):
    """
    Check for existing keystore. Generate if missing.
    Write keystore.properties. Create backup note. Update .gitignore.
    """
    print_header("Preparing Signing Keystore")

    keystore_path = project_dir / KEYSTORE_RELATIVE
    keystore_props_path = project_dir / KEYSTORE_PROPS_RELATIVE

    keystore_path.parent.mkdir(parents=True, exist_ok=True)

    if keystore_path.is_file():
        print_ok("Keystore exists (reusing)", str(keystore_path))
        if not keystore_props_path.is_file():
            print_warn(
                "keystore.properties missing. Cannot regenerate passwords for existing keystore.\n"
                "  Please create keystore.properties manually with the original passwords."
            )
            fail(
                "keystore.properties not found for existing keystore.\n"
                "  Provide android/keystore/keystore.properties with the correct passwords."
            )
        print_ok("Keystore properties found", str(keystore_props_path))
        return

    print_warn("Keystore not found. Generating new keystore...")

    store_password = generate_strong_password(32)
    key_password = generate_strong_password(32)

    keytool_cmd = [
        str(keytool_path),
        "-genkeypair",
        "-v",
        "-keystore", str(keystore_path),
        "-alias", KEYSTORE_ALIAS,
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-storepass", store_password,
        "-keypass", key_password,
        "-dname", (
            "CN=Old Alex Hub, OU=MindVault, O=Old Alex Hub, "
            "L=Unknown, ST=Unknown, C=US"
        ),
    ]

    try:
        result = subprocess.run(
            keytool_cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            print(result.stdout)
            print(result.stderr)
            fail(f"keytool failed with exit code {result.returncode}.")
    except FileNotFoundError:
        fail(f"keytool not found at: {keytool_path}")
    except subprocess.TimeoutExpired:
        fail("keytool timed out.")

    if not keystore_path.is_file():
        fail("Keystore file was not created by keytool.")

    print_ok("Keystore generated", str(keystore_path))

    # Write keystore.properties
    # Use relative path from android/ directory for storeFile
    props_content = (
        f"storeFile=keystore/mindvault-release.keystore\n"
        f"storePassword={store_password}\n"
        f"keyAlias={KEYSTORE_ALIAS}\n"
        f"keyPassword={key_password}\n"
    )
    with open(keystore_props_path, "w", encoding="utf-8") as f:
        f.write(props_content)
    print_ok("Keystore properties written", str(keystore_props_path))

    # Write backup note
    releases_docs = project_dir / RELEASES_DOCS_RELATIVE
    releases_docs.mkdir(parents=True, exist_ok=True)
    backup_note_path = releases_docs / "signing-backup-note.md"
    backup_note_content = (
        "# Signing Keystore Backup Instructions\n\n"
        "CRITICAL: Back up these files immediately. Losing the keystore means you\n"
        "cannot update MindVault on Google Play. Google Play requires the same\n"
        "signing key for all future updates.\n\n"
        "## Files to Back Up\n\n"
        "1. `android/keystore/mindvault-release.keystore`\n"
        "2. `android/keystore/keystore.properties` (contains passwords)\n\n"
        "## Backup Destinations\n\n"
        "- Encrypted password manager (e.g., Bitwarden, 1Password, KeePass)\n"
        "- Secure cloud storage (encrypted)\n"
        "- External drive stored in a safe location\n\n"
        "## What Happens If You Lose the Keystore\n\n"
        "If you lose the keystore, you cannot publish updates to the existing app\n"
        "on Google Play. You would need to publish a new app listing.\n"
        "Google Play App Signing (where Google manages the key) can prevent this\n"
        "risk for future apps.\n\n"
        "## Keystore Details\n\n"
        f"- Keystore file: android/keystore/mindvault-release.keystore\n"
        f"- Keystore alias: {KEYSTORE_ALIAS}\n"
        f"- Validity: 10000 days\n"
        "- Passwords: stored in android/keystore/keystore.properties\n\n"
        "## Security Note\n\n"
        "Do NOT commit keystore files or keystore.properties to version control.\n"
        "These files are excluded by .gitignore.\n"
    )
    with open(backup_note_path, "w", encoding="utf-8") as f:
        f.write(backup_note_content)
    print_ok("Backup note written", str(backup_note_path))

    _update_gitignore(project_dir)

    print()
    print("  *** IMPORTANT: Back up the keystore and its passwords immediately. ***")
    print(f"  Keystore: {keystore_path}")
    print(f"  Properties: {keystore_props_path}")
    print(f"  Backup guide: {backup_note_path}")


def _update_gitignore(project_dir):
    """Add keystore and sensitive files to .gitignore if not already present."""
    gitignore_path = project_dir / ".gitignore"

    entries_to_add = [
        "android/keystore/*.keystore",
        "android/keystore/keystore.properties",
        "android/local.properties",
    ]

    existing_content = ""
    if gitignore_path.is_file():
        with open(gitignore_path, "r", encoding="utf-8") as f:
            existing_content = f.read()

    lines_to_append = []
    for entry in entries_to_add:
        if entry not in existing_content:
            lines_to_append.append(entry)

    if lines_to_append:
        with open(gitignore_path, "a", encoding="utf-8") as f:
            f.write("\n# Release signing (added by release.py)\n")
            for line in lines_to_append:
                f.write(line + "\n")
        print_ok(".gitignore updated with keystore exclusions")
    else:
        print_ok(".gitignore already contains keystore exclusions")


# ---------------------------------------------------------------------------
# Phase 5a: Generate launcher icons from assets/logo.png
# ---------------------------------------------------------------------------

def generate_launcher_icons(project_dir):
    """
    Resize assets/logo.png into all Android mipmap densities.
    Requires Pillow. If Pillow is not installed, print a warning and continue.
    """
    print_header("Generating Launcher Icons")
    logo_path = os.path.join(project_dir, "assets", "logo.png")
    if not os.path.exists(logo_path):
        print_warn("assets/logo.png not found. Skipping icon generation.")
        return

    try:
        from PIL import Image
    except ImportError:
        print_warn("Pillow not installed. Skipping icon generation. Run: pip install Pillow")
        return

    res_base = os.path.join(project_dir, "android", "app", "src", "main", "res")
    sizes = {
        "mipmap-mdpi":    48,
        "mipmap-hdpi":    72,
        "mipmap-xhdpi":   96,
        "mipmap-xxhdpi":  144,
        "mipmap-xxxhdpi": 192,
    }

    img = Image.open(logo_path).convert("RGBA")
    for folder, size in sizes.items():
        out_dir = os.path.join(res_base, folder)
        os.makedirs(out_dir, exist_ok=True)
        resized = img.resize((size, size), Image.LANCZOS)
        resized.save(os.path.join(out_dir, "ic_launcher.png"), "PNG")
        resized.save(os.path.join(out_dir, "ic_launcher_round.png"), "PNG")
        print_ok(f"{folder}: {size}x{size}")


# ---------------------------------------------------------------------------
# Phase 5: Verify AdMob config
# ---------------------------------------------------------------------------

def verify_admob_config(project_dir):
    """
    Read src/config/admob.ts and verify AdMob IDs are present.
    Returns dict with app_id, banner_id, publisher_id.
    """
    print_header("Verifying AdMob Configuration")

    admob_ts = project_dir / ADMOB_CONFIG_RELATIVE
    if not admob_ts.is_file():
        print_warn("admob.ts not found", str(admob_ts))
        return {"app_id": "", "banner_id": "", "publisher_id": ""}

    try:
        with open(admob_ts, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print_warn(f"Could not read admob.ts: {e}")
        return {"app_id": "", "banner_id": "", "publisher_id": ""}

    def extract_value(key):
        import re
        pattern = rf"export\s+const\s+{key}\s*=\s*['\"]([^'\"]+)['\"]"
        match = re.search(pattern, content)
        return match.group(1) if match else ""

    app_id = extract_value("ADMOB_APP_ID")
    banner_id = extract_value("BANNER_AD_UNIT_ID")
    publisher_id = extract_value("ADMOB_PUBLISHER_ID")

    if app_id:
        print_ok("ADMOB_APP_ID", app_id)
    else:
        print_warn("ADMOB_APP_ID not found or empty in admob.ts")

    if banner_id:
        print_ok("BANNER_AD_UNIT_ID", banner_id)
    else:
        print_warn("BANNER_AD_UNIT_ID not found or empty in admob.ts")

    if publisher_id:
        print_ok("ADMOB_PUBLISHER_ID", publisher_id)
    else:
        print_warn("ADMOB_PUBLISHER_ID not found or empty in admob.ts")

    print_ok("app-ads.txt seller line", APP_ADS_TXT_LINE)

    return {"app_id": app_id, "banner_id": banner_id, "publisher_id": publisher_id}


# ---------------------------------------------------------------------------
# Phase 6: Run Build
# ---------------------------------------------------------------------------

def run_build(project_dir, do_clean=False):
    """
    Run gradlew assembleRelease and bundleRelease from android/ directory.
    Streams output. Fails clearly if Gradle fails.
    """
    print_header("Running Gradle Build")

    android_dir = project_dir / "android"
    if not android_dir.is_dir():
        fail(f"android/ directory not found: {android_dir}")

    if IS_WINDOWS:
        gradlew = android_dir / "gradlew.bat"
        if not gradlew.is_file():
            fail(f"gradlew.bat not found: {gradlew}")
        gradlew_cmd = str(gradlew)
    else:
        gradlew = android_dir / "gradlew"
        if not gradlew.is_file():
            fail(f"gradlew not found: {gradlew}")
        gradlew.chmod(gradlew.stat().st_mode | 0o111)
        gradlew_cmd = str(gradlew)

    def run_gradle(task):
        print(f"\n  Running: {gradlew_cmd} {task}")
        print()
        if IS_WINDOWS:
            cmd = f'"{gradlew_cmd}" {task}'
            result = subprocess.run(
                cmd,
                shell=True,
                cwd=str(android_dir),
                env=os.environ.copy(),
            )
        else:
            result = subprocess.run(
                [gradlew_cmd, task],
                shell=False,
                cwd=str(android_dir),
                env=os.environ.copy(),
            )
        if result.returncode != 0:
            fail(f"Gradle task '{task}' failed with exit code {result.returncode}.")
        print_ok(f"Gradle task '{task}' completed successfully")

    if do_clean:
        run_gradle("clean")

    run_gradle("assembleRelease")
    run_gradle("bundleRelease")


# ---------------------------------------------------------------------------
# Phase 7: Copy Artifacts
# ---------------------------------------------------------------------------

def copy_artifacts(project_dir):
    """
    Find APK and AAB, copy to releases/builds/v{VERSION}/.
    Returns (apk_dest, aab_dest).
    """
    print_header("Copying Build Artifacts")

    apk_src_dir = project_dir / "android" / "app" / "build" / "outputs" / "apk" / "release"
    aab_src_dir = project_dir / "android" / "app" / "build" / "outputs" / "bundle" / "release"

    dest_dir = project_dir / RELEASES_BUILDS_RELATIVE
    dest_dir.mkdir(parents=True, exist_ok=True)

    apk_dest = None
    aab_dest = None

    # Find APK
    apk_files = list(apk_src_dir.glob("*.apk")) if apk_src_dir.is_dir() else []
    if apk_files:
        apk_src = apk_files[0]
        apk_dest = dest_dir / apk_src.name
        shutil.copy2(str(apk_src), str(apk_dest))
        print_ok("APK copied", str(apk_dest))
    else:
        print_warn("APK not found", str(apk_src_dir))

    # Find AAB
    aab_files = list(aab_src_dir.glob("*.aab")) if aab_src_dir.is_dir() else []
    if aab_files:
        aab_src = aab_files[0]
        aab_dest = dest_dir / aab_src.name
        shutil.copy2(str(aab_src), str(aab_dest))
        print_ok("AAB copied", str(aab_dest))
    else:
        print_warn("AAB not found", str(aab_src_dir))

    return apk_dest, aab_dest


# ---------------------------------------------------------------------------
# Phase 8: Copy Store Assets
# ---------------------------------------------------------------------------

def copy_store_assets(project_dir):
    """Copy all files from mindvault/store_assets/ to releases/store-assets/."""
    print_header("Copying Store Assets")

    src_dir = project_dir / STORE_ASSETS_RELATIVE
    dest_dir = project_dir / RELEASES_STORE_ASSETS_RELATIVE

    if not src_dir.is_dir():
        print_warn("store_assets/ directory not found", str(src_dir))
        return

    dest_dir.mkdir(parents=True, exist_ok=True)

    copied_count = 0
    for item in src_dir.iterdir():
        if item.is_file():
            dest_file = dest_dir / item.name
            shutil.copy2(str(item), str(dest_file))
            print_ok("Copied", item.name)
            copied_count += 1

    print_ok(f"Store assets copied ({copied_count} files)", str(dest_dir))


# ---------------------------------------------------------------------------
# Phase 9: Print Summary
# ---------------------------------------------------------------------------

def print_summary(project_dir, apk_dest, aab_dest, admob_config, build_skipped=False):
    print_header("Build Summary")

    if build_skipped:
        print_ok("Build status", "SKIPPED (--skip-build)")
    else:
        print_ok("Build status", "COMPLETE")

    if apk_dest:
        print_ok("APK", str(apk_dest))
    else:
        print_warn("APK", "Not found / not copied")

    if aab_dest:
        print_ok("AAB", str(aab_dest))
    else:
        print_warn("AAB", "Not found / not copied")

    print()
    print("  AdMob Configuration:")
    app_id = admob_config.get("app_id", "")
    banner_id = admob_config.get("banner_id", "")
    publisher_id = admob_config.get("publisher_id", "")

    if app_id:
        print_ok("AdMob App ID", app_id)
    else:
        print_warn("AdMob App ID", "NOT CONFIGURED")

    if banner_id:
        print_ok("Banner Ad Unit ID", banner_id)
    else:
        print_warn("Banner Ad Unit ID", "NOT CONFIGURED")

    if publisher_id:
        print_ok("Publisher ID", publisher_id)
    else:
        print_warn("Publisher ID", "NOT CONFIGURED")

    print()
    print("  app-ads.txt:")
    print_ok("app-ads.txt seller line status", "Provided")
    print_ok("app-ads.txt seller line", APP_ADS_TXT_LINE)

    store_assets_dest = project_dir / RELEASES_STORE_ASSETS_RELATIVE
    ads_notes = store_assets_dest / "app-ads-txt-notes.md"
    print_ok("app-ads.txt notes", str(ads_notes))

    print()
    keystore_path = project_dir / KEYSTORE_RELATIVE
    print_warn(
        "KEYSTORE BACKUP REMINDER: Back up the keystore and its passwords immediately.\n"
        f"  Keystore: {keystore_path}\n"
        f"  Properties: {project_dir / KEYSTORE_PROPS_RELATIVE}\n"
        "  See releases/docs/signing-backup-note.md for instructions."
    )

    print()
    print_warn(
        "app-ads.txt REMINDER: Confirm the app-ads.txt file is publicly hosted on\n"
        "  the developer website domain used in Google Play Console.\n"
        f"  Required content: {APP_ADS_TXT_LINE}"
    )

    print()
    print(SEPARATOR)
    print("  Release process complete.")
    print(SEPARATOR)
    print()


# ---------------------------------------------------------------------------
# Check Environment (standalone)
# ---------------------------------------------------------------------------

def check_env_and_exit(project_dir):
    """Print environment check report and exit."""
    print_header("Environment Check Report")

    # Java
    java_home = os.environ.get("JAVA_HOME", "")
    keytool_name = "keytool.exe" if IS_WINDOWS else "keytool"
    java_ok = False
    keytool_path_str = "NOT FOUND"
    java_home_str = java_home if java_home else "NOT SET"

    if java_home:
        kt = Path(java_home) / "bin" / keytool_name
        if kt.is_file():
            java_ok = True
            keytool_path_str = str(kt)

    if java_ok:
        print_ok("Java path (JAVA_HOME)", java_home_str)
        print_ok("keytool path", keytool_path_str)
    else:
        print_fail("Java path (JAVA_HOME)", java_home_str)
        print_fail("keytool path", keytool_path_str)

    # Android SDK
    android_home = os.environ.get("ANDROID_HOME", "")
    android_sdk_root = os.environ.get("ANDROID_SDK_ROOT", "")
    sdk_dir_str = android_home or android_sdk_root or "NOT SET"
    adb_name = "adb.exe" if IS_WINDOWS else "adb"
    adb_str = "NOT FOUND"
    sdk_ok = False

    local_props = project_dir / LOCAL_PROPS_RELATIVE
    local_props_sdk = ""
    if local_props.is_file():
        local_props_sdk = _read_sdk_dir_from_local_properties(local_props)

    sdk_candidate = android_home or android_sdk_root or local_props_sdk
    if sdk_candidate:
        adb_candidate = Path(sdk_candidate) / "platform-tools" / adb_name
        if adb_candidate.is_file():
            sdk_ok = True
            adb_str = str(adb_candidate)

    if sdk_ok:
        print_ok("Android SDK path", sdk_candidate)
        print_ok("ANDROID_HOME", android_home or "(derived)")
        print_ok("ANDROID_SDK_ROOT", android_sdk_root or "(derived)")
        print_ok("local.properties path", str(local_props))
        print_ok("local.properties sdk.dir", local_props_sdk or "(not written yet)")
        print_ok("adb path", adb_str)
    else:
        print_fail("Android SDK path", sdk_dir_str)
        print_fail("ANDROID_HOME", android_home or "NOT SET")
        print_fail("ANDROID_SDK_ROOT", android_sdk_root or "NOT SET")
        print_ok("local.properties path", str(local_props))
        print_fail("local.properties sdk.dir", local_props_sdk or "(not found)")
        print_fail("adb path", adb_str)

    # Gradle wrapper
    if IS_WINDOWS:
        gradlew = project_dir / "android" / "gradlew.bat"
    else:
        gradlew = project_dir / "android" / "gradlew"

    if gradlew.is_file():
        print_ok("Gradle wrapper", str(gradlew))
    else:
        print_fail("Gradle wrapper", str(gradlew))

    # Build possible?
    apk_build_ok = java_ok and sdk_ok and gradlew.is_file()
    aab_build_ok = apk_build_ok

    if apk_build_ok:
        print_ok("APK build possible", "yes")
    else:
        print_fail("APK build possible", "no (fix Java / SDK / Gradle issues above)")

    if aab_build_ok:
        print_ok("AAB build possible", "yes")
    else:
        print_fail("AAB build possible", "no (fix Java / SDK / Gradle issues above)")

    # AdMob config
    admob_config = verify_admob_config(project_dir)

    if admob_config.get("app_id"):
        print_ok("AdMob App ID configured", "yes")
    else:
        print_fail("AdMob App ID configured", "no")

    if admob_config.get("banner_id"):
        print_ok("Banner Ad Unit ID configured", "yes")
    else:
        print_fail("Banner Ad Unit ID configured", "no")

    if admob_config.get("publisher_id"):
        print_ok("Publisher ID configured", "yes")
    else:
        print_fail("Publisher ID configured", "no")

    print_ok("app-ads.txt seller line provided", "yes")
    print_ok("app-ads.txt seller line", APP_ADS_TXT_LINE)

    print()
    print(SEPARATOR)
    print("  Environment check complete.")
    print(SEPARATOR)
    print()
    sys.exit(0)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()

    print()
    print(SEPARATOR)
    print("  MindVault Release Automation Script")
    print(f"  Version: {APP_VERSION}")
    print(f"  Platform: {platform.system()} {platform.release()}")
    print(f"  Python: {sys.version.split()[0]}")
    print(SEPARATOR)

    # Phase 1: Locate project
    project_dir = locate_project()

    # Handle --check-env early (after locating project so we can read local.properties)
    if args.check_env:
        # Try to find Java and SDK silently to populate env before check
        try:
            java_home_path, keytool = check_java(project_dir)
        except SystemExit:
            pass
        try:
            check_android_sdk(project_dir)
        except SystemExit:
            pass
        check_env_and_exit(project_dir)

    # Phase 2: Check Java
    java_home_path, keytool_path = check_java(project_dir)

    # Phase 3: Check Android SDK
    sdk_dir = check_android_sdk(project_dir)

    # Handle --generate-key-only
    if args.generate_key_only:
        prepare_signing(project_dir, keytool_path)
        print()
        print("  Keystore generation complete. Exiting.")
        print()
        sys.exit(0)

    # Phase 4: Prepare signing
    prepare_signing(project_dir, keytool_path)

    # Phase 5a: Generate launcher icons
    generate_launcher_icons(project_dir)

    # Phase 5: Verify AdMob config
    admob_config = verify_admob_config(project_dir)

    apk_dest = None
    aab_dest = None

    if not args.skip_build:
        # Determine clean behavior
        do_clean = args.clean and not args.no_clean
        if not args.clean and not args.no_clean:
            # Default: no clean
            do_clean = False

        # Phase 6: Run build
        run_build(project_dir, do_clean=do_clean)

        # Phase 7: Copy artifacts
        apk_dest, aab_dest = copy_artifacts(project_dir)
    else:
        print_header("Skipping Gradle Build (--skip-build)")
        print_ok("Attempting to copy existing artifacts if present")
        apk_dest, aab_dest = copy_artifacts(project_dir)

    # Phase 8: Copy store assets
    copy_store_assets(project_dir)

    # Phase 9: Print summary
    print_summary(project_dir, apk_dest, aab_dest, admob_config, build_skipped=args.skip_build)


if __name__ == "__main__":
    main()
