// Cybersecurity roadmap data derived from cyber-daily-295.jsx
// This file intentionally contains only plain JavaScript (no React / JSX).

// Dates
const START_DATE = new Date("2026-03-11");

function getDateForDay(day) {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + day - 1);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTodayDay() {
  const today = new Date();
  const diff = Math.floor((today - START_DATE) / 86400000) + 1;
  return Math.max(1, Math.min(295, diff));
}

// Phases
const PHASES = [
  { id: 1, label: "Phase 1", title: "Computer + Linux + Networking", days: [1, 40], color: "#00e5ff", tag: "FOUNDATIONS" },
  { id: 2, label: "Phase 2", title: "Web Technology", days: [41, 80], color: "#69ff47", tag: "WEB BASICS" },
  { id: 3, label: "Phase 3", title: "Web Hacking", days: [81, 200], color: "#ff9f0a", tag: "CORE HACKING" },
  { id: 4, label: "Phase 4", title: "Advanced Web + Bug Bounty", days: [201, 240], color: "#ff453a", tag: "ADVANCED" },
  { id: 5, label: "Phase 5", title: "Privilege Escalation", days: [241, 270], color: "#bf5af2", tag: "POST EXPLOIT" },
  { id: 6, label: "Phase 6", title: "Red Team Basics", days: [271, 295], color: "#ff2d55", tag: "RED TEAM" },
];

function getPhase(day) {
  return PHASES.find(p => day >= p.days[0] && day <= p.days[1]) || PHASES[0];
}

// All days. For now we seed Days 1–5 exactly; you can extend this file
// by copying additional day definitions from your original cyber-daily-295.jsx.
const DAYS = {};

function d(day, title, topic, reading, tutorial, practical) {
  DAYS[day] = { day, title, topic, reading, tutorial, practical };
}

// --- Phase 1 sample days (1–5) ---

d(
  1,
  "Install Your Lab Environment",
  "Setup",
  `## Why You Need a Dedicated Lab

Every hacker and security professional works from a controlled environment — not their personal machine. Kali Linux is the industry-standard penetration testing distribution, pre-loaded with hundreds of tools: nmap, Burp Suite, Metasploit, Wireshark, and more.

Running it in a VM (Virtual Machine) means it is completely isolated from your main OS. If you break something, delete the VM and rebuild. That freedom to experiment without fear is essential to learning fast.

**What you are installing today:**
- **Kali Linux** — your main attack machine
- **VirtualBox or VMware** — the VM software that runs Kali
- **Burp Suite Community** — web traffic proxy (pre-installed in Kali)
- **Wireshark** — packet analyser (pre-installed in Kali)
- **VS Code** — text editor for writing scripts and notes

**Your folder structure** (create this today and use it forever):
\`\`\`
~/cybersecurity/
  notes/       ← one .md file per topic
  labs/        ← output from every lab
  scripts/     ← Python/Bash scripts you write
  screenshots/ ← proof of every finding
\`\`\`

This is not optional housekeeping — professional pentesters get paid partly for their documentation. Build the habit on Day 1.`,
  [
    {
      q: "Why do security professionals use a separate VM instead of their main operating system for hacking?",
      hint: "Think about what happens when things go wrong — malware samples, broken configs, accidental damage.",
      a: "Three main reasons: (1) Isolation — if you run malware samples, test exploits, or misconfigure a network tool, the damage is contained inside the VM. Your main OS is untouched. (2) Reproducibility — you can snapshot a clean state and revert instantly. (3) Tool availability — Kali Linux comes with every security tool pre-installed and pre-configured. Setting all that up on Windows would take days.",
    },
    {
      q: "What is the difference between Kali Linux and a regular Ubuntu/Debian installation?",
      hint: "Think about who built it, what it is designed for, and what comes pre-installed.",
      a: "Kali is a Debian-based distribution maintained by Offensive Security, built specifically for penetration testing and security research. It comes pre-installed with 600+ security tools (nmap, Metasploit, Burp Suite, Wireshark, sqlmap, etc.), has a custom kernel with support for packet injection (needed for WiFi attacks), and is configured for a security workflow. A regular Ubuntu install has none of these tools and is designed for general desktop use.",
    },
  ],
  `**On your HOST machine (Windows/Mac):**

1. Download VirtualBox: https://www.virtualbox.org/wiki/Downloads
   - Choose the installer for your OS, run it, accept defaults

2. Download Kali Linux VM image: https://www.kali.org/get-kali/#kali-virtual-machines
   - Choose VirtualBox 64-bit .ova file (~3GB download)

3. Import into VirtualBox:
   - File → Import Appliance → select the .ova file
   - Leave all settings as default → Import
   - Start the VM → login: kali / kali

**Inside Kali — first commands:**
\`\`\`bash
sudo apt update && sudo apt upgrade -y
mkdir -p ~/cybersecurity/{notes,labs,scripts,screenshots}
ls ~/cybersecurity/
\`\`\`

**Verify tools exist:**
\`\`\`bash
nmap --version
burpsuite &
wireshark --version
python3 --version
\`\`\`

**Take a VirtualBox snapshot:**
- In VirtualBox top menu: Machine → Take Snapshot → name it "Clean Install"
- Now if anything breaks, you restore to this point in seconds.`
);

d(
  2,
  "Linux Terminal Navigation",
  "Linux Basics",
  `## The Terminal Is Your Weapon

Everything in cybersecurity happens in the terminal. GUI tools are wrappers around terminal commands — if you understand the underlying commands, you understand the tool. No understanding → you cannot troubleshoot, adapt, or script.

**The Linux filesystem tree:**
\`\`\`
/
├── home/        ← user home directories (/home/kali is yours)
├── etc/         ← system config files — attackers love this
├── var/log/     ← log files — defenders live here
├── tmp/         ← temporary files, world-writable — attackers stage here
├── usr/bin/     ← installed programs (ls, cat, nmap, python3...)
├── root/        ← root user's home directory
└── proc/        ← live kernel and process information
\`\`\`

**The most important navigation commands:**
| Command | What it does | Example |
|---------|-------------|---------|
| \`pwd\` | Print Working Directory — where am I? | \`pwd\` → /home/kali |
| \`ls\` | List files | \`ls -la\` shows hidden files + permissions |
| \`cd\` | Change directory | \`cd /etc\` or \`cd ..\` (go up) |
| \`mkdir\` | Make directory | \`mkdir myfolder\` |
| \`touch\` | Create empty file | \`touch notes.txt\` |
| \`cat\` | Print file contents | \`cat /etc/passwd\` |
| \`cp\` | Copy file | \`cp file.txt backup.txt\` |
| \`mv\` | Move or rename | \`mv old.txt new.txt\` |
| \`rm\` | Delete (no recycle bin!) | \`rm file.txt\` |

**Why \`ls -la\` matters:**
The \`-l\` flag shows permissions and ownership. The \`-a\` flag shows hidden files (those starting with a dot). Every file on Linux has a 10-character permission string. You must be able to read this instantly.`,
  [
    {
      q: "You type 'ls -la' and see: '-rwxr-xr-- 1 root staff 4096 file.sh'. Who can execute this file and who cannot?",
      hint: "Break the permission string into three groups of three: owner, group, others.",
      a: "Permission string: -rwxr-xr--\n- First character '-' = regular file\n- 'rwx' (owner: root) = root can read, write, AND execute\n- 'r-x' (group: staff) = staff members can read and execute, NOT write\n- 'r--' (others: everyone else) = can ONLY read, cannot execute or write\n\nSo: root and staff members can execute it. Everyone else cannot.",
    },
    {
      q: "What is the purpose of the /tmp directory and why do attackers specifically use it during a compromise?",
      hint: "Think about what permissions /tmp has and what that means for a low-privilege attacker.",
      a: "/tmp is world-writable — any user on the system, including low-privilege service accounts like www-data, can write files there. Attackers use it to: (1) Upload tools and exploit scripts they downloaded, (2) Stage payloads before execution, (3) Write output from reconnaissance commands. It is also usually not monitored as closely as /home or /opt. After a compromise, /tmp is always the first place investigators check for attacker tools.",
    },
  ],
  `**Open your terminal in Kali and run each command:**
\`\`\`bash
# See where you are
pwd

# List current directory (notice the columns: permissions, owner, size, date, name)
ls -la

# Navigate to key system directories and explore
cd /etc && ls -la
cd /var/log && ls -la
cd /tmp && ls -la
cd ~ && pwd
\`\`\`

**Build your practice folder:**
\`\`\`bash
cd ~/cybersecurity/labs
mkdir day2-linux
cd day2-linux
touch file1.txt file2.txt file3.txt
ls -la
cp file1.txt file1_backup.txt
mv file2.txt renamed.txt
ls -la
rm file3.txt
ls -la
\`\`\`

**Write your first notes file:**
\`\`\`bash
nano ~/cybersecurity/notes/linux_commands.md
\`\`\`
Inside nano, type what each command does in your own words. Press Ctrl+X, Y, Enter to save.`
);

d(
  3,
  "File Permissions & Users",
  "Linux Basics",
  `## Permissions Are The Security Model

Linux permissions control who can read, write, and execute every file on the system. Understanding permissions is not just "Linux basics" — it is the foundation of privilege escalation, the skill that lets you go from a limited account to root after compromising a machine.

**The permission string decoded:**
\`\`\`
-  rwx  r-x  r--
↑   ↑    ↑    ↑
|  owner group others
file type
\`\`\`

**Numeric (octal) permissions:**
| Symbol | Number | Meaning |
|--------|--------|---------|
| r | 4 | Read |
| w | 2 | Write |
| x | 1 | Execute |

So \`chmod 755\` means:
- 7 (4+2+1) = rwx for owner
- 5 (4+0+1) = r-x for group
- 5 (4+0+1) = r-x for others

**The SUID bit — the most important permission for hackers:**

When a file has the SUID bit set (\`chmod u+s\`), it runs with the file owner's permissions, not the executing user's permissions. The 's' appears in the execute position:

\`-rwsr-xr-x 1 root root /usr/bin/passwd\``,
  [
    {
      q: "What does chmod 644 mean in terms of rwx notation? Is this safe for a config file containing an API key?",
      hint: "Break 6 and 4 down by adding r=4, w=2, x=1. Then think about who can read it.",
      a: "chmod 644 = rw-r--r--\n- Owner: rw- = can read and write, cannot execute\n- Group: r-- = can only read\n- Others: r-- = can only read\n\nFor a config file with an API key, 644 is NOT safe. Anyone on the system (others) can read it. The correct permission for sensitive config files is 600 (rw-------) — only the owner can read or write it. Group and others have zero access.",
    },
    {
      q: "You run 'find / -perm -4000 2>/dev/null' and see '/usr/bin/python3' in the results. Write the exact command to exploit this for a root shell.",
      hint: "SUID means it runs as root. Python can run OS commands. You need to use -p to preserve the elevated UID.",
      a: "The exploit command:\n/usr/bin/python3 -c 'import os; os.execl(\"/bin/bash\", \"bash\", \"-p\")'\n\nBreaking it down:\n- import os — Python's OS module lets you run system calls\n- os.execl — replaces the current process with a new one\n- /bin/bash — the new process is bash\n- 'bash' — argv[0], the name of the process\n- '-p' — CRITICAL: tells bash not to drop the elevated (SUID root) effective UID\n\nWithout -p, bash sees the SUID bit and drops privileges for security. With -p, you keep euid=0 (root). Verify with: id",
    },
  ],
  `**Explore permissions on your Kali system:**
\`\`\`bash
# Check permissions on sensitive files
ls -la /etc/passwd /etc/shadow
# Note: shadow is readable only by root — try: cat /etc/shadow
# You should get: Permission denied

# Find all SUID files (the privesc checklist)
find / -perm -4000 -type f 2>/dev/null

# Practice chmod
cd ~/cybersecurity/labs
touch testscript.sh
echo '#!/bin/bash\necho "I am running as: $(whoami)"' > testscript.sh
ls -la testscript.sh  # No execute permission yet
./testscript.sh       # Permission denied
chmod +x testscript.sh
./testscript.sh       # Now it runs
chmod 755 testscript.sh
ls -la testscript.sh  # Shows -rwxr-xr-x
chmod 600 testscript.sh
ls -la testscript.sh  # Shows -rw------- (only you can read/write)
\`\`\`

**Check your own identity:**
\`\`\`bash
whoami      # your username
id          # UID, GID, all groups you belong to
groups      # group memberships
\`\`\``
);

// Expose globally for dashboard.js
window.CYBER_ROADMAP = {
  START_DATE,
  getDateForDay,
  getTodayDay,
  PHASES,
  DAYS,
  getPhase,
};

