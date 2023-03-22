const api = 'http://localhost:3000/songs';

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_STORAGE_KEY = 'MaterPlayer';

const player = $(".player");
const audio = $("#audio");
const btnPlaying = $$(".toolbox__driver--toggle-play");
const progress = $$("#progress");
const progressValue = $$("progress");
const listSong = $(".list-song");
const songImage = $(".song-infor__image");
const songTitle = $(".song-infor__title");
const songAuthor = $(".song-infor__author");
const btnNext = $(".toolbox__driver--forward");
const btnPrev = $(".toolbox__driver--backward");
const btnHeart = $(".taskbox__option--toggle-heart");
const btnRandom = $(".taskbar--random");
const btnRepeat = $(".taskbar--repeat");
const songList = $(".list-song");
const playList = $(".playlist");
const btnCrossBar = $(".btn-cross-bar");
const toolbar = $(".toolbar");

const app = {
    lengthSongs: 0,
    currentIndex: 0,
    isPlaying: false,
    isHeart: false,
    isRandom: false,
    isRepeat: false,
    isShowPlaylist: false,
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
    songs: [
        {
            name: "Ylang Ylang",
            singer: "FKJ (((O)))",
            path: "./Music/ylangylang.mp3",
            image: "./Image/ylang.jpg"
        }
    ],
    setConfig(key, value){
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
    },
    render(){
        const htmls = this.songs.map((song, index) => {
            return `
                <div class="song" data-index="${index}">
                    <div class="song__thumb" style="background-image: url('${song.image}"></div>
                    <div class="song__body">
                        <h3 class="body__title">${song.name}</h3>
                        <p class="body__author">${song.singer}</p>
                    </div>
                </div>
            `
        })
        listSong.innerHTML = htmls.join("\n");
    },
    defineProperties(){
        Object.defineProperty(this, 'currentSong', {
            get(){
                return this.songs[this.currentIndex];
            }
        })
    },
    handleEvent(){
        // Note:
        //   + Khi lắng nghe sự kiện dùng tham số event của callback
        //     thì chỉ lắng nghe trên đúng trên thẻ đó mà ko lan ra
        //     thẻ con.
        //   + elementNode.closest(querySelector) khi click vào con của 
        //     querySelector thì trả về node của querySelector nếu ko
        //     click vào con thì trả về null.

        const _this = this;
        // Xử lý click play
        for(var i=0;i<btnPlaying.length;i++){
            btnPlaying[i].onclick = function(){
                if(_this.isPlaying) audio.pause();
                else audio.play();
            }
        }
        // Khi song được chạy
        audio.onplay = function(){
            _this.isPlaying = true;
            player.classList.add("playing");
            _this.setConfig('currentIndex', _this.currentIndex);
            const nowSong = $(`.song[data-index='${_this.currentIndex}']`);
            nowSong.classList.add('active');
            _this.scrollToActiveSong(nowSong);
        }
        // Khi song bị pause
        audio.onpause = function(){
            _this.isPlaying = false;
            player.classList.remove("playing");
        }
        // Xử lý tiến độ bài hát khi thay đổi
        audio.ontimeupdate = function(){
            const progressPercent = Math.floor(audio.currentTime / audio.duration * 100);
            for(var i=0;i<progress.length;i++){
                progress[i].value = isNaN(progressPercent) ? 0 : progressPercent;
                progressValue[i].value = isNaN(progressPercent) ? 0 : progressPercent;
            }
        }
        // Xử lý khi tua
        for(var i=0;i<progress.length;i++){
            progress[i].onchange = function(){
                this.onmousedown = function(){
                    audio.pause();
                }
                const seekTime = this.value * audio.duration / 100;
                audio.currentTime = seekTime;
                audio.play();
            }
        }
        // Khi next song
        btnNext.onclick = function(){
            $(`.song[data-index='${_this.currentIndex}']`).classList.remove('active');
            if(_this.isRandom) _this.randomSong();
            else _this.nextSong();
            audio.play();
        }
        // Khi prev song
        btnPrev.onclick = function(){
            $(`.song[data-index='${_this.currentIndex}']`).classList.remove('active');
            if(_this.isRandom) _this.randomSong();
            else _this.prevSong();
            audio.play();
        }
        // Xử lý khi bấm vào heart
        btnHeart.onclick = function(){
            _this.isHeart = !_this.isHeart;
            _this.setConfig('isHeart', _this.isHeart);
            this.classList.toggle("active");
        }
        // Xử lý random bật tắt song
        btnRandom.onclick = function(){
            _this.isRandom = !_this.isRandom;
            _this.setConfig('isRandom', _this.isRandom);
            this.classList.toggle("active");
        }
        // Xử lý lặp lại song  
        btnRepeat.onclick = function(){
            _this.isRepeat = !_this.isRepeat;
            _this.setConfig('isRepeat', _this.isRepeat);
            this.classList.toggle("active");
        }  
        // Xử lý kết thúc song
        audio.onended = function(){
            if(_this.isRepeat) audio.play();
            else btnNext.click();
        }
        // Lắng nghe hành vi click vào songList
        songList.onclick = function(e){
            const songNode = e.target.closest(".song:not(.active)");
            if(songNode){
                $(`.song[data-index='${_this.currentIndex}']`).classList.remove('active');
                _this.currentIndex = songNode.dataset.index;
                _this.loadCurrentSong();
                audio.play();
            }
        }
        // Xử lý hành vi show playlist
        btnCrossBar.onclick = function(){
            _this.isShowPlaylist = !_this.isShowPlaylist;
            if(_this.isShowPlaylist) {
                playList.style.height = '80%';
                toolbar.style.opacity = 1;
            }
            else{
                playList.style.height = '25%';
                toolbar.style.opacity = 0;
            } 
        }
    },
    getList(callback){
        try{
            fetch(api)
            .then(response => response.json())
            .then((songs) => {
                this.songs.push(...songs);
            })
            .then(callback)
            .catch((error)=>{
                console.error("Fetch API: ", error);
                callback();
            })
        }catch{
            console.error("Other error:", error);
        }
    },
    loadCurrentSong(){
        songImage.style.backgroundImage = `url('${this.currentSong.image}')`;
        songTitle.innerText = this.currentSong.name;
        songAuthor.innerText = this.currentSong.singer;
        audio.src = this.currentSong.path;
    },
    loadConfig(){
        if(this.config.currentIndex < this.songs.length)
            this.currentIndex = this.config.currentIndex;
        
        this.isRandom = this.config.isRandom;
        this.isRepeat = this.config.isRepeat;
        this.isHeart = this.config.isHeart;
        
        if(this.isRandom) btnRandom.classList.toggle("active");
        if(this.isRepeat) btnRepeat.classList.toggle("active");
        if(this.isHeart) btnHeart.classList.toggle("active");
    },
    nextSong(){
        this.currentIndex++;
        if(this.currentIndex >= this.songs.length)
            this.currentIndex = 0;
        this.loadCurrentSong()
    },
    prevSong(){
        this.currentIndex--;
        if(this.currentIndex < 0)
            this.currentIndex = this.songs.length - 1;
        this.loadCurrentSong()
    },
    randomSong(){
        let randomIndex;
        do{
            randomIndex = Math.floor(Math.random()*this.songs.length);
        }while(randomIndex === this.currentIndex);
        this.currentIndex = randomIndex;
        this.loadCurrentSong();
    },
    scrollToActiveSong(nowSong){
        setTimeout(()=>{
            nowSong.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            })
        }, 300);
    },
    start(){
        this.getList(()=>{
            this.handles();
        })
    },
    handles(){
        // Gán cấu hình config vào ứng dụng
        this.loadConfig();
        // Định nghĩa thuộc tính cho Object
        this.defineProperties()
        // Lắng nghe và xử lý các sự kiện (DOM Event)
        this.handleEvent();
        // Tải thông tin bài hát đầu tiên vào UI khi tải ứng dụng
        this.loadCurrentSong();
        // Render list
        this.render();
        // console.log(this.lengthSongs)
    }
};

/** 
    Quy luật thứ tự chạy callback:

    function callback(){
        console.log("Start!")
    }
    function func(callback){
        console.log("Finish!");
    }

    Trường hợp 1:
    func(callback()) => khi func được gọi thì callback() thực hiện xong in ra Start! rồi sau đó Finish!
    tuy nhiên nếu đoạn callback() có bất đồng bộ (setTimeOut, primise, fetch,...) thì finish in ra trước.
    Trường hợp 2:
    func(()=>{
        callback();
    }) => khi func được gọi thì chỉ in ra Finish! bởi lúc này tham số truyền vào func dc coi là một bản
    thiết kế của callback vậy. Để thực hiện nó ta phải gọi trong func.
    
**/
app.start();
// localStorage.removeItem(PLAYER_STORAGE_KEY);
