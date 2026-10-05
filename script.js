// ==========================================
// 1. ELEMEN UI & VARIABEL PENYIMPANAN
// ==========================================
const queueBtn = document.getElementById('queueBtn');
const queuePanel = document.getElementById('queuePanel');
const queueList = document.getElementById('queueList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const searchInput = document.getElementById('searchInput');
const spotifyList = document.getElementById('spotifyList');

let queueData = []; 
let currentSearchResults = []; 
let currentPage = 1;
const itemsPerPage = 5; 
let currentVideoCandidates = [];
let currentCandidateIndex = 0;

// ==========================================
// 2. FUNGSI UNTUK MENAMPILKAN HASIL PENCARIAN
// ==========================================
// INI ADALAH FUNGSI YANG HILANG SEBELUMNYA
function renderSpotifyList(data) {
    spotifyList.innerHTML = ""; // Bersihkan list sebelumnya
    
    data.forEach(song => {
        const li = document.createElement('li');
        li.className = 'spotify-list-item';
        
        li.innerHTML = `
            <img src="${song.cover}" alt="${song.title}">
            <div class="spotify-song-info">
                <span class="spotify-song-title">${song.title}</span>
                <span class="spotify-song-artist">${song.artist}</span>
            </div>
            <button class="add-btn" onclick="addToQueue('${song.id}')">+</button>
        `;
        
        spotifyList.appendChild(li);
    });
}

// ==========================================
// 3. FUNGSI MENCARI LAGU (KONEK KE BACKEND)
// ==========================================
async function searchSpotifySongs(query) {
    try {
        const response = await fetch(`/api/search?q=${query}`);
        const data = await response.json();

        // Cek apakah server mengirimkan error
        if (data.error) {
            spotifyList.innerHTML = `
                <div style="padding: 20px; color: #d9534f; text-align: center;">
                    <b>Error dari Server:</b><br>${data.error}
                </div>`;
            return; 
        }

        // Jika lagu ditemukan
        if (data.tracks && data.tracks.items.length > 0) {
            currentSearchResults = data.tracks.items.map(track => {
                return {
                    id: track.id,
                    title: track.name,
                    artist: track.artists[0].name,
                    cover: track.album.images[1] ? track.album.images[1].url : 'https://via.placeholder.com/50'
                };
            });
            // Memanggil fungsi render yang sekarang sudah ada
            renderSpotifyList(currentSearchResults);
        } else {
            // Jika pencarian kosong/tidak ada lagu
            spotifyList.innerHTML = `
                <div style="text-align: center; padding: 40px 10px; color: #8c7b68;">
                    <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;">🔍</div>
                    <h3 style="margin-bottom: 8px; color: #5c4e40;">Lagu Tidak Ditemukan</h3>
                    <p style="font-size: 0.9rem;">Coba gunakan kata kunci atau nama artis yang lebih spesifik.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Gagal mengambil data:", error);
        spotifyList.innerHTML = `
            <div style="text-align: center; padding: 40px 10px; color: #d9534f;">
                <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;">⚠️</div>
                <h3 style="margin-bottom: 8px;">Terjadi Kesalahan</h3>
                <p style="font-size: 0.9rem;">Gagal terhubung ke API Lokal.</p>
            </div>
        `;
    }
}

// ==========================================
// 4. EVENT LISTENER PENCARIAN
// ==========================================
searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const keyword = searchInput.value;
        if (keyword.trim() !== '') {
            spotifyList.innerHTML = "<p style='padding: 10px;'>Searching...</p>";
            searchSpotifySongs(keyword);
        }
    }
});

// ==========================================
// 5. FITUR QUEUE (ANTREAN)
// ==========================================
window.addToQueue = function(songId) {
    const songToAdd = currentSearchResults.find(s => s.id === songId);
    
    if (songToAdd) {
        if (!isPlaying) {
            playSong(songToAdd);
        } else {
            queueData.push(songToAdd);
            currentPage = Math.ceil(queueData.length / itemsPerPage) || 1;
            renderQueue('none');
        }
        
        queueBtn.style.transform = "scale(1.3)";
        setTimeout(() => queueBtn.style.transform = "scale(1)", 200);
    }
}

// --- A. Fungsi Tombol Hapus dari Queue ---
window.removeFromQueue = function(indexInQueue) {
    queueData.splice(indexInQueue, 1);
    
    const totalPages = Math.ceil(queueData.length / itemsPerPage) || 1;
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    
    // Render ulang tampilan antrean
    renderQueue('none');
};

// --- B. Fungsi Tombol Skip ---
const skipBtn = document.getElementById('skipBtn');
if (skipBtn) {
    skipBtn.addEventListener('click', () => {
        // Memanggil fungsi playNextInQueue untuk langsung melompat ke lagu pertama di antrean
        playNextInQueue();
    });
}

function renderQueue(direction = 'right') {
    queueList.innerHTML = ""; 
    
    queueList.classList.remove('animate-slide-right', 'animate-slide-left');
    void queueList.offsetWidth; 
    
    if (direction === 'right') {
        queueList.classList.add('animate-slide-right');
    } else if (direction === 'left') {
        queueList.classList.add('animate-slide-left');
    }

    const totalPages = Math.ceil(queueData.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const songsToDisplay = queueData.slice(startIndex, endIndex);

    songsToDisplay.forEach((song, relativeIndex) => {
        const actualIndex = startIndex + relativeIndex; // Indeks asli di dalam array queueData
        
        const li = document.createElement('li');
        
        const img = document.createElement('img');
        img.src = song.cover;
        img.alt = song.title;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'queue-song-info';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'queue-song-title';
        titleSpan.textContent = song.title;
        
        const artistSpan = document.createElement('span');
        artistSpan.className = 'queue-song-artist';
        artistSpan.textContent = song.artist;
        
        infoDiv.appendChild(titleSpan);
        infoDiv.appendChild(artistSpan);
        
        // Tombol Hapus (Format bulat konsisten di sebelah kanan)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'queue-delete-btn';
        deleteBtn.textContent = 'x'; // Ikon silang
        deleteBtn.title = 'Delete';
        // Saat diklik, panggil fungsi hapus berdasarkan indeks aslinya
        deleteBtn.onclick = () => removeFromQueue(actualIndex);
        
        li.appendChild(img);
        li.appendChild(infoDiv);
        li.appendChild(deleteBtn); // Masukkan tombol hapus ke ujung kanan
        
        queueList.appendChild(li);
    });

    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// ==========================================
// 6. EVENT LISTENER UI LAINNYA
// ==========================================
queueBtn.addEventListener('click', () => {
    queuePanel.classList.toggle('show');
    if (!queuePanel.classList.contains('show')) {
        queuePanel.classList.remove('window-slide-right', 'window-slide-left');
    }
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderQueue('left'); 
    }
});

nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(queueData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderQueue('right'); 
    }
});

// Render antrean pertama kali (kosong)
renderQueue('none');

// ==========================================
// 7. INTEGRASI YOUTUBE PLAYER & LOGIKA PEMUTARAN
// ==========================================

const npTitle = document.getElementById('npTitle');
const npArtist = document.getElementById('npArtist');
const npCover = document.getElementById('npCover');

let isPlaying = false; 
let ytPlayer;

// --- A. Memuat Script YouTube IFrame API secara dinamis ---
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('ytplayer', {
        height: '100%',
        width: '100%',
        videoId: '', // Mulai dengan kosong
        playerVars: {
            'autoplay': 1,
            'controls': 1,
            'rel': 0
        },
        events: {
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

// Mendeteksi status video (Play, Pause, Ended)
function onPlayerStateChange(event) {
    if (event.data === 0) {
        playNextInQueue();
    }
}

// --- B. Fungsi Memutar Lagu ---
async function playSong(song) {
    isPlaying = true;
    
    npTitle.textContent = song.title;
    npArtist.textContent = song.artist;
    npCover.src = song.cover;
    npCover.classList.add('spin-anim');

    const searchQuery = `${song.title} ${song.artist} karaoke`;
    
    const videoId = await fetchYouTubeVideo(searchQuery);

    // 4. Putar Video
    if (videoId && ytPlayer) {
        ytPlayer.loadVideoById(videoId);
    } else {
        alert("Video karaoke tidak ditemukan!");
        playNextInQueue();
    }
}

// --- C. Mencari Video ID dari YouTube Data API ---
async function fetchYouTubeVideo(query) {
    
    try {
        // Panggil backend Vercel lokal kita, bukan Google langsung
        const response = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            // Ambil semua kandidat video seperti sebelumnya
            currentVideoCandidates = data.items.map(item => item.id.videoId);
            currentCandidateIndex = 0; 
            
            return currentVideoCandidates[currentCandidateIndex];
        }
    } catch (error) {
        console.error("Gagal mengambil data dari YouTube:", error);
    }
    return null;
}

// --- D. Lanjut ke Lagu Berikutnya di Antrean ---
function playNextInQueue() {
    if (queueData.length > 0) {
        const nextSong = queueData.shift(); 
        
        renderQueue('none'); 
        
        playSong(nextSong);
    } else {
        isPlaying = false;
        npTitle.textContent = "Queue Empty";
        npArtist.textContent = "Grab a song to start!";
        npCover.classList.remove('spin-anim');
        if (ytPlayer) ytPlayer.stopVideo();
    }
}

function onPlayerError(event) {
    if (event.data === 101 || event.data === 150) {
        console.warn("Video diblokir untuk embed. Mencoba video alternatif...");
        
        currentCandidateIndex++;
        
        if (currentCandidateIndex < currentVideoCandidates.length) {
            const nextVideoId = currentVideoCandidates[currentCandidateIndex];
            ytPlayer.loadVideoById(nextVideoId);
        } else {
            alert("Semua video alternatif untuk lagu ini diblokir oleh pemiliknya.");
            playNextInQueue();
        }
    }
}