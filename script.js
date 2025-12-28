console.log('Lets write JavaScript');
let currentSong = new Audio(); //global variable so that only one song play at a time
let songs;
let currFolder;

function toMMSS(totalSeconds) { //copied from chatGPT
    // Guard: NaN, negative, or non‑finite input
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "00:00";

    const seconds = Math.floor(totalSeconds);        // ignore any fractional part
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    // String.padStart(2, "0") guarantees two digits
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}


async function getSongs(folder) {
    currFolder = folder;
    let response = await fetch(`${folder}/songs.json`); // Fetch the specific songs.json for this folder
    songs = await response.json();
    //Get the UL tag to put the songs in
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]; //.getElementsByTagName() returns an html collection of all ul's. [0] accesses the 1st element from that collection
    songUL.innerHTML = ""; //clear the old list

    //Add each song t the list
    for (let i = 0; i < songs.length; i++) {
        let songName = songs[i].split(" -")[0];
        let songArtist = songs[i].split("-")[1].replace(".mp3", "").trim();
        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" src= "Assets/music.svg" alt="">
                                                <div class="info">
                                                    <div>${songName}</div>
                                                    <div style="font-size: smaller;">${songArtist}</div>
                                                </div>
                                                <div class="playnow">
                                                    <img src="Assets/play.svg" al="">
                                                </div>
                                                </li>`;
    }
    //Attach click listeners to the new list items
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach((e,idx)=>{
        e.addEventListener("click", ()=>{
            playMusic(songs[idx]);
        });
    });

    return songs;
}


const playMusic = (track, pause = false) => {
    //use the current folder path
    currentSong.src = `${currFolder}/` + track;
    if (!pause) {
        currentSong.play()
        play.src = "Assets/pause.svg"
    }
    let songInfo = track.split(".")[0];
    let [songName, songArtist] = songInfo.split("-");

    document.querySelector(".songtime").innerHTML = "00:00/00:00" //Initially, after loading the page, show this songTime

    document.querySelector(".songname").innerHTML = songName? songName.trim() : track;
    document.querySelector(".songartist").innerHTML = songArtist? songArtist.trim() : "";
}


async function main() {
    // 1. Load a default playlist on startup (e.g., the first folder)

    await getSongs("songs/Alan Walker");// an array of songs is created
    playMusic(songs[0], true) //This part is for auto-loading the first song but don't play


    // 2. Display Albums/Cards Logic
    // Select all cards
    Array.from(document.getElementsByClassName("card")).forEach((e)=>{
        e.addEventListener("click", async item =>{
            // Get the folder name from the data-folder attribute we added in HTML
            let folder = item.currentTarget.dataset.folder;
            //Fetch songs from that folder
            songs = await getSongs(`songs/${folder}`);
            playMusic(songs[0]); //Autoplay the 1st song from that playlist
        });
    });

    //Attach an event listener to play, pause
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "Assets/pause.svg"
        }
        else {
            currentSong.pause()
            play.src = "Assets/play.svg"
        }
    })

    //Listen for time update event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = toMMSS(currentSong.currentTime) + "/" + toMMSS(currentSong.duration)
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"
    })

    /*  event.target - returns the exact DOM element that triggered the event.
        element.getBoundingClientRect() - it tells us exactly where an element is on the screen and how big it is
        event.offsetX - returns the horizontal position of the mouse pointer relative to the target element’s padding edge
        Therefore, e.offsetX = at what dist from left I clicked the seekbar
                   e.target.getBoundingClientRect().width = gives the total length or width of the seekbar
    */

    //Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let fraction = (e.offsetX / e.target.getBoundingClientRect().width)
        console.log(fraction * 100 + "%")
        document.querySelector(".circle").style.left = fraction * 100 + "%"
        currentSong.currentTime = (fraction * currentSong.duration)
    })

    //Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    //Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%"
    })

    //Add an event listener to previous button
    previous.addEventListener("click", () => {
        currentSong.pause();
        console.log(currentSong.src);
        let currentSongName = decodeURI(currentSong.src.split("/").pop());
        let idx = songs.indexOf(currentSongName);
        if(idx>0) playMusic(songs[idx-1]);
        else playMusic(songs[songs.length-1]);
    })

    //Add an event listener to next button
    next.addEventListener("click", () => {
        currentSong.pause();
        let currentSongName = decodeURI(currentSong.src.split("/").pop());
        let idx = songs.indexOf(currentSongName);
        if(idx<songs.length-1) playMusic(songs[idx+1]);
        else playMusic(songs[0]);
    })

    //Add an event listener to autoplay next song when the current song ends
    currentSong.addEventListener("ended", ()=>{
        let currentSongName = decodeURI(currentSong.src.split("/").pop());
        let idx = songs.indexOf(currentSongName);
        if(idx<songs.length-1) playMusic(songs[idx+1]);
        else playMusic(songs[0]);
    })

    //Add an event listener to volume slider
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change",(e)=>{
        console.log("Setting vol to ", e.target.value, "/100");
        currentSong.volume = parseInt(e.target.value)/100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("Assets/mute.svg", "Assets/volume.svg");
        }
    })

    //Add an event listener to mute the track on click
    let lastVol = 1;
    vol.addEventListener("click", (e)=>{
        if(e.target.src.includes("Assets/volume.svg")){
            lastVol = currentSong.volume;
            e.target.src = e.target.src.replace("Assets/volume.svg","Assets/mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else{
            e.target.src = e.target.src.replace("Assets/mute.svg","Assets/volume.svg");
            currentSong.volume = lastVol;
            document.querySelector(".range").getElementsByTagName("input")[0].value = lastVol*100;
        }
    })

}

main()