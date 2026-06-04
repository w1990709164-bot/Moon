const {createApp,ref,computed,nextTick,onMounted,watch}=Vue;
const COLORS=['rgba(90,110,74,.8)','rgba(90,115,140,.8)','rgba(140,90,90,.8)','rgba(130,105,70,.8)','rgba(95,85,130,.8)','rgba(65,110,100,.8)'];
const PWP=[
  {id:'field',name:'草原',url:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=70'},
  {id:'mist',name:'晨雾',url:'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=70'},
  {id:'lake',name:'湖',url:'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=70'},
  {id:'snow',name:'雪山',url:'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=800&q=70'},
  {id:'dark',name:'暗林',url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=70'},
  {id:'rain',name:'雨天',url:'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=800&q=70'},
];
const WIP={
  music:{emoji:'🎵',name:'音乐',desc:'和角色一起听歌\n发送歌词 歌名 热评给TA'},
  weather:{emoji:'⛅',name:'天气',desc:'实时天气，让角色也知道'},
  calendar:{emoji:'📅',name:'日历',desc:'查看行程 添加日程'},
  memory_x:{emoji:'🧠',name:'记忆',desc:'AI自动总结对话记忆'},
  door:{emoji:'🚪',name:'门',desc:'虚拟与角色线下见面'},
  forum:{emoji:'🗣️',name:'论坛',desc:'角色自动生成的论坛内容'},
  invasion:{emoji:'🔓',name:'入侵',desc:'查看角色的手机'},
  mailbox:{emoji:'📮',name:'匿名信箱',desc:'匿名提问或收到神秘提问'},
  blindbox:{emoji:'🎁',name:'每日盲盒',desc:'每天12点刷新触发互动'},
  worldbook:{emoji:'📖',name:'世界书',desc:'设定世界观背景'},
  moments:{emoji:'🌐',name:'朋友圈',desc:'查看角色动态（即将上线）'},
  groupchat:{emoji:'👥',name:'群聊',desc:'多角色群聊（即将上线）'},
};
const EMOJIS=['😊','😂','🥰','😭','🤣','❤️','😍','🙏','😅','👍','🎉','🥺','😘','💕','✨','🌸','💔','😔','🤔','😏','👀','🫶','💫','🌙','☁️','🍃','🤍','🖤','💚','🌿','🎵','🎶','📸','🌊','🏔️','🌅','🦋','🌺','🍵','☕'];

const LANG_MAP={zh:'中文',en:'English',ja:'日本語',ko:'한국어',de:'Deutsch'};
const TRANS_SUFFIX='';

createApp({
  setup(){
    const pg=ref('lock'),T=ref(''),D=ref('');
    const typing=ref(false),hasInput=ref(false);
    const showSt=ref(false),showAdd=ref(false),showEditChar=ref(false);
    const showSidebar=ref(false),showEmojiPanel=ref(false);
    const showWhisperMask=ref(false),whisperText=ref(''),whisperLoading=ref(false),whisperCharName=ref('');
    const activeChar=ref(null);
    const msgBox=ref(null),anchor=ref(null),inputEl=ref(null),avInput=ref(null);
    const previewImg=ref(null);
    const fetchingModels=ref(false),modelList=ref([]);
    const userAvatar=ref(localStorage.getItem('userAvatar')||'');
    const memoryLib=ref(JSON.parse(localStorage.getItem('memoryLib')||'{}'));
    const memoryChar=ref('');
    const memorySummarizing=ref(false);

    const wall=ref(localStorage.getItem('wp')||PWP[0].url);
    const chars=ref(JSON.parse(localStorage.getItem('chars')||'[]'));
    const allMsgs=ref(JSON.parse(localStorage.getItem('msgs')||'{}'));
    const api=ref(JSON.parse(localStorage.getItem('api')||'{"url":"","key":"","model":"","minimaxKey":"","minimaxGroup":""}'));
    const preWP=ref(PWP);
    const emojis=ref(EMOJIS);
    const nc=ref({name:'',emoji:'🌿',avatarImg:'',realName:'',birthday:'',identity:'',relation:'',system:''});

const minimaxVoices=ref([]);


    const wallSt=computed(()=>({backgroundImage:`url(${wall.value})`}));
    const wipList=computed(()=>Object.keys(WIP));
    const wipI=computed(()=>WIP[pg.value]||{emoji:'🚧',name:'功能',desc:''});
    const totalUnread=computed(()=>chars.value.reduce((a,c)=>a+(c.unread||0),0));
    const curMsgs=computed(()=>activeChar.value?(allMsgs.value[activeChar.value.id]||[]):[]);
    const currentMemory=computed(()=>memoryLib.value[memoryChar.value]||[]);
    // 初始化memoryChar
    if(chars.value.length>0&&!memoryChar.value)memoryChar.value=chars.value[0].id;

    const charSettings=computed(()=>{
      if(!activeChar.value)return{contextDepth:20,language:'zh',translateOn:false,voiceId:'',voiceProb:0};
      if(!activeChar.value.settings)activeChar.value.settings={contextDepth:20,language:'zh',translateOn:false,voiceId:'',voiceProb:0};
      return activeChar.value.settings;
    });

    const todayN=ref(new Date().getDate());
    const calM=ref(`${new Date().getFullYear()} · ${new Date().getMonth()+1}`);
    const weekDays=computed(()=>{
      const d=new Date(),dow=d.getDay();
      return Array.from({length:7},(_,i)=>{const day=new Date(d);day.setDate(d.getDate()-dow+i);return{date:day.getDate(),isToday:day.getDate()===d.getDate()&&day.getMonth()===d.getMonth()}});
    });

    function tick(){
      const d=new Date();
      T.value=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      const ws=['日','一','二','三','四','五','六'];
      D.value=`${d.getMonth()+1}月${d.getDate()}日 周${ws[d.getDay()]}`;
    }
    tick();setInterval(tick,1000);

    function unlock(){pg.value='home'}
    function go(id){pg.value=id;showEmojiPanel.value=false}

    // 全屏
    const isFullscreen=ref(!!document.fullscreenElement);
    function toggleFullscreen(){
      if(!document.fullscreenElement){
        const el=document.documentElement;
        (el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen||function(){}).call(el);
      }else{
        (document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen||document.msExitFullscreen||function(){}).call(document);
      }
    }
    document.addEventListener('fullscreenchange',()=>{isFullscreen.value=!!document.fullscreenElement});
    document.addEventListener('webkitfullscreenchange',()=>{isFullscreen.value=!!document.webkitFullscreenElement});
    function lastMsg(id){const m=allMsgs.value[id];if(!m||!m.length)return'暂无消息';const last=m[m.length-1];if(last.type==='image')return'[图片]';return last.content.slice(0,26)+(last.content.length>26?'…':'')}
    function lastTime(id){const m=allMsgs.value[id];return(m&&m.length)?m[m.length-1].time.slice(0,5):''}
    function showT(i){
      if(i===0)return true;
      const m=curMsgs.value;
      return m[i].ts-m[i-1].ts>180000;
    }
    function formatMsgTime(ts){
      if(!ts)return'';
      const d=new Date(ts);
      const now=new Date();
      const isSameDay=d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
      const hm=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      if(isSameDay)return hm;
      return`${d.getMonth()+1}-${String(d.getDate()).padStart(2,'0')} ${hm}`;
    }
    function isLastInGroup(i){
      const m=curMsgs.value;
      if(i>=m.length-1)return true;
      const next=m[i+1];
      if(!next)return true;
      // 同一角色连续消息：只有最后一条显示时间
      if(next.role===m[i].role)return next.time!==m[i].time;
      return true;
    }

    // ===== 倒查手机 =====
    const rcheckAlert=ref(false);    // 底部警报弹窗
    const rcheckActive=ref(false);   // 正在被查手机
    const rcheckChar=ref(null);      // 哪个角色在查
    const rcheckWhisper=ref('');     // 角色查手机时的心声
    let rcheckTimer=null;

    // 触发倒查（在收到消息后调用）
    async function maybeReverseCheck(char){
      if(rcheckAlert.value||rcheckActive.value)return;
      // 只有关系为恋人时才有概率触发
      const rel=(char.relation||char.identity||'').toLowerCase();
      const isLover=['恋人','男友','女友','情人','lover','boyfriend','girlfriend','partner','伴侣','对象'].some(k=>rel.includes(k));
      if(!isLover)return;
      if(Math.random()>0.20)return; // 20%概率
      rcheckChar.value=char;
      rcheckAlert.value=true;
      // 10秒无操作自动允许
      rcheckTimer=setTimeout(()=>{
        if(rcheckAlert.value)rcheckAllow();
      },10000);
    }

    function rcheckBlock(){
      clearTimeout(rcheckTimer);
      rcheckAlert.value=false;
      // 角色在对话中询问为何不让看
      const char=rcheckChar.value;
      if(!char)return;
      const id=char.id;
      const now=new Date();
      const t=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
      const blockLines=['为什么不让我看？','你手机里有什么不能让我看的？','你在藏什么？','我就随便看看，你这反应……','拦截我？有意思。'];
      const line=blockLines[Math.floor(Math.random()*blockLines.length)];
      if(!allMsgs.value[id])allMsgs.value[id]=[];
      allMsgs.value[id].push({role:'assistant',content:line,bubbles:[line],translations:null,showTrans:false,time:t,ts:now.getTime()});
      saveMsgs();
      nextTick(scrollB);
    }

    async function rcheckAllow(){
      clearTimeout(rcheckTimer);
      rcheckAlert.value=false;
      const char=rcheckChar.value;
      if(!char)return;
      rcheckActive.value=true;
      rcheckWhisper.value='正在翻看…';
      // 生成心声
      try{
        if(api.value.url&&api.value.key){
          const sys=`${char.system||'你是'+char.name+'。'}你正在偷看对方的手机。用一句话20字内中文表达此刻心理，只写心理不写动作。`;
          const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:'生成'}],stream:false,max_tokens:60})});
          const data=await res.json();
          const w=data.choices?.[0]?.message?.content||'';
          if(w)rcheckWhisper.value=w.trim().slice(0,40);
        }
      }catch(e){console.warn('rcheck whisper',e)}
      // 跳转消息列表
      pg.value='wechat';
      // 随机30-60秒后角色"查完"主动退出
      const delay=Math.floor(Math.random()*30000+30000);
      rcheckAutoTimer=setTimeout(()=>rcheckFinish(),delay);
    }

    // 角色查完主动退出：在对话框说一句话
    async function rcheckFinish(){
      clearTimeout(rcheckAutoTimer);
      const char=rcheckChar.value;
      if(!char){rcheckEnd();return;}
      // 生成角色查完后说的话
      let line='好了，看完了。';
      let lineTranslation=null;
      try{
        if(api.value.url&&api.value.key){
          const sys=`${char.system||'你是'+char.name+'。'}你刚查看了对方的手机，现在查完了。说一句话（20-40字，母语，符合角色性格），可以表达满意/吃醋/释怀/意外等情绪，像真人发消息一样。只输出JSON：{"content":"母语原文","translation":"中文翻译"}`;
          const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:'生成'}],stream:false,max_tokens:100})});
          const data=await res.json();
          const raw=(data.choices?.[0]?.message?.content||'').replace(/```json|```/g,'').trim();
          try{const obj=JSON.parse(raw);line=obj.content||line;lineTranslation=obj.translation||null;}catch(e){line=raw||line;}
        }
      }catch(e){console.warn('rcheck finish',e)}
      // 发送到对话框
      const id=char.id;
      const now=new Date();
      const t=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
      if(!allMsgs.value[id])allMsgs.value[id]=[];
      const finishTranslations=lineTranslation?[lineTranslation]:null;
      allMsgs.value[id].push({role:'assistant',content:line,bubbles:[line],translations:finishTranslations,showTrans:false,time:t,ts:now.getTime()});
      saveMsgs();
      openChat(char);
      await nextTick(scrollB);
      rcheckEnd();
    }

    // 用户主动抢回手机
    async function rcheckGrabBack(){
      clearTimeout(rcheckAutoTimer);
      const char=rcheckChar.value;
      if(!char){rcheckEnd();return;}
      let line='……';
      let lineTranslation=null;
      try{
        if(api.value.url&&api.value.key){
          const sys=`${char.system||'你是'+char.name+'。'}你正在查对方手机，突然被发现了、手机被抢走了。说一句话（10-30字，母语，符合角色性格），表达被抓包的反应。只输出JSON：{"content":"母语原文","translation":"中文翻译"}`;
          const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:'生成'}],stream:false,max_tokens:80})});
          const data=await res.json();
          const raw=(data.choices?.[0]?.message?.content||'').replace(/```json|```/g,'').trim();
          try{const obj=JSON.parse(raw);line=obj.content||line;lineTranslation=obj.translation||null;}catch(e){line=raw||line;}
        }
      }catch(e){console.warn('rcheck grab',e)}
      const id=char.id;
      const now=new Date();
      const t=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
      if(!allMsgs.value[id])allMsgs.value[id]=[];
      const grabTranslations=lineTranslation?[lineTranslation]:null;
      allMsgs.value[id].push({role:'assistant',content:line,bubbles:[line],translations:grabTranslations,showTrans:false,time:t,ts:now.getTime()});
      saveMsgs();
      openChat(char);
      await nextTick(scrollB);
      rcheckEnd();
    }

    let rcheckAutoTimer=null;
    function rcheckEnd(){
      rcheckActive.value=false;
      rcheckChar.value=null;
      rcheckWhisper.value='';
    }

    // ===== MiniMax TTS =====
    let ttsAudio=null;
    async function speakBubbles(bubbles){
      const settings=charSettings.value;
      if(!settings.voiceId||!settings.voiceProb)return;
      if(Math.random()*100>Number(settings.voiceProb))return;
      if(!api.value.minimaxKey||!api.value.minimaxGroup)return;
      // 拼接所有bubble为完整文本
      const text=bubbles.join(' ').trim();
      if(!text)return;
      try{
        const res=await fetch(`https://api.minimax.chat/v1/t2a_v2?GroupId=${api.value.minimaxGroup}`,{
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.minimaxKey},
          body:JSON.stringify({
            model:'speech-01-turbo',
            text,
            stream:false,
            voice_setting:{voice_id:settings.voiceId,speed:1.0,vol:1.0,pitch:0},
            audio_setting:{sample_rate:32000,bitrate:128000,format:'mp3'}
          })
        });
        const data=await res.json();
        // MiniMax返回base64音频
        const audioHex=data.data?.audio;
        if(!audioHex)return;
        // hex转Uint8Array
        const bytes=new Uint8Array(audioHex.match(/.{1,2}/g).map(b=>parseInt(b,16)));
        const blob=new Blob([bytes],{type:'audio/mp3'});
        const url=URL.createObjectURL(blob);
        if(ttsAudio){ttsAudio.pause();URL.revokeObjectURL(ttsAudio.src)}
        ttsAudio=new Audio(url);
        ttsAudio.play();
        ttsAudio.onended=()=>{URL.revokeObjectURL(url);ttsAudio=null};
      }catch(e){console.error('TTS error:',e)}
    }
    function openChat(c){activeChar.value=c;c.unread=0;saveChars();pg.value='chat';showEmojiPanel.value=false;nextTick(scrollB)}
    function scrollB(){if(anchor.value)anchor.value.scrollIntoView({behavior:'smooth'})}
    function onInput(){hasInput.value=inputEl.value&&inputEl.value.innerText.trim().length>0}

    // 键盘弹出修复 - 监听visualViewport
    function onInputFocus(){
      setTimeout(()=>{
        if(anchor.value)anchor.value.scrollIntoView({behavior:'smooth'});
        if(window.visualViewport){
          const vv=window.visualViewport;
          const offset=window.innerHeight-vv.height;
          if(offset>100&&msgBox.value){msgBox.value.style.paddingBottom=offset+'px';}
        }
      },300);
    }
    function onInputBlur(){if(msgBox.value)msgBox.value.style.paddingBottom='';}
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize',()=>{
        if(document.activeElement===inputEl.value){
          const offset=window.innerHeight-window.visualViewport.height;
          if(offset>100&&msgBox.value){msgBox.value.style.paddingBottom=offset+'px';if(anchor.value)anchor.value.scrollIntoView();}
          else if(msgBox.value){msgBox.value.style.paddingBottom='';}
        }
      });
    }

    // 右滑返回手势
    let swipeX0=0;
    function swipeStart(e){swipeX0=e.touches[0].clientX}
    function swipeEnd(e){
      const dx=e.changedTouches[0].clientX-swipeX0;
      if(dx>80&&swipeX0<40){
        if(pg.value==='chat')pg.value='wechat';
        else if(pg.value==='meet')pg.value='door';
        else if(pg.value==='forum'){
          if(forumDetailPost.value)forumDetailPost.value=null;
          else pg.value='home';
        }
        else if(pg.value==='mailbox'||pg.value==='invasion'||pg.value==='blindbox'||pg.value==='door'||pg.value==='groupchat')pg.value='home';
      }
    }

    // 长按消息菜单
    const msgActionMenu=ref(null);
    let msgLpTimer=null;
    function msgLongpressStart(e,msg,idx){msgLpTimer=setTimeout(()=>{const touch=e.touches?.[0]||e;const x=Math.min(touch.clientX,window.innerWidth-150);const y=Math.max(touch.clientY-130,60);msgActionMenu.value={msg,idx,x,y}},500)}
    function msgLongpressEnd(){clearTimeout(msgLpTimer)}
    function msgShowMenu(e,msg,idx){const x=Math.min(e.clientX,window.innerWidth-150);const y=Math.max(e.clientY-130,60);msgActionMenu.value={msg,idx,x,y}}
    function msgRetract(msg,idx){const id=activeChar.value?.id;if(!id)return;const msgs=allMsgs.value[id];if(msgs&&msgs[idx]){msgs[idx].retracted=true;msgs[idx].content='[已撤回]';saveMsgs()}msgActionMenu.value=null}
    function msgDelete(idx){const id=activeChar.value?.id;if(!id)return;const msgs=allMsgs.value[id];if(msgs){msgs.splice(idx,1);saveMsgs()}msgActionMenu.value=null}

    // 已读：用户进入聊天时标记AI消息为已读
    watch(()=>pg.value,(v)=>{if(v==='chat'&&activeChar.value){const id=activeChar.value.id;const msgs=allMsgs.value[id];if(msgs)msgs.forEach(m=>{if(m.role==='user')m.read=true});saveMsgs()}});

    // 表情包系统
    const emojiTab=ref('emoji');
    const stickerList=ref(JSON.parse(localStorage.getItem('stickerList')||'[]'));
    const stickerUrlInput=ref('');
    const showStickerMgmt=ref(false);
    function saveStickerList(){localStorage.setItem('stickerList',JSON.stringify(stickerList.value))}
    function addStickerUrl(){const u=stickerUrlInput.value.trim();if(!u)return;stickerList.value.push(u);saveStickerList();stickerUrlInput.value=''}
    function addStickerFile(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{stickerList.value.push(ev.target.result);saveStickerList()};r.readAsDataURL(f);e.target.value=''}
    function removeSticker(idx){stickerList.value.splice(idx,1);saveStickerList()}
    function sendSticker(url){
      const id=activeChar.value?.id;if(!id)return;
      const now=new Date();const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      if(!allMsgs.value[id])allMsgs.value[id]=[];
      allMsgs.value[id].push({role:'user',type:'sticker',content:url,time:t,ts:now.getTime()});
      saveMsgs();showEmojiPanel.value=false;nextTick(scrollB);
    }

    // 多气泡：重写parseReply使用bubbles数组
    // 已在send函数中处理，此处无需改动

    // AI主动回复
    async function triggerAiReply(){
      if(typing.value||!activeChar.value)return;
      const id=activeChar.value.id;if(!allMsgs.value[id]||allMsgs.value[id].length===0)return;
      typing.value=true;await nextTick(scrollB);
      try{
        const sys=buildSystemPrompt('');const hist=buildHistory(id);const raw=await callAPI(hist,sys);
        const parsed=parseReplyMulti(raw);
        const n2=new Date();const t2=`${String(n2.getHours()).padStart(2,'0')}:${String(n2.getMinutes()).padStart(2,'0')}`;
        allMsgs.value[id].push({role:'assistant',content:parsed.bubbles.join('\n'),bubbles:parsed.bubbles,translations:parsed.translations||null,whisper:parsed.whisper||null,showTrans:false,time:t2,ts:n2.getTime()});
        saveMsgs();checkAutoSummarize(id);
        speakBubbles(parsed.bubbles);
      }catch(e){allMsgs.value[id].push({role:'assistant',content:'⚠️ '+e.message,bubbles:['⚠️ '+e.message],time:T.value,ts:Date.now()});saveMsgs()}
      finally{typing.value=false;await nextTick(scrollB)}
    }

    // 多气泡解析
    function parseReplyMulti(raw){
      try{
        const clean=raw.replace(/```json|```/g,'').trim();
        const obj=JSON.parse(clean);
        const bubbles=obj.messages||[];
        // translations是数组，每条bubble对应各自译文
        let translations=null;
        if(Array.isArray(obj.translations)&&obj.translations.length>0){
          translations=obj.translations;
        }else if(obj.translation){
          // 兼容旧格式：整体译文拆给每条
          translations=bubbles.map(()=>obj.translation);
        }
        return{bubbles,translations,whisper:obj.whisper||null};
      }catch(e){return{bubbles:[raw],translations:null,whisper:null}}
    }

    // ════ 匿名信箱 ════
    const mbTab=ref('char');
    const mbCharId=ref(chars.value[0]?.id||'');
    const mbGenerating=ref(false);
    const mbShowWrite=ref(false);
    const mbNewQuestion=ref('');
    const mbAllLetters=ref(JSON.parse(localStorage.getItem('mbLetters')||'{}'));
    // mbAllLetters结构: {charId:[{question,reply,time,replying}], user:[{question,charId,userReply,charResponse,time,inputText}]}
    const mbCharLetters=computed(()=>(mbAllLetters.value[mbCharId.value]||[]).slice().reverse());
    const mbUserLetters=computed(()=>(mbAllLetters.value['user']||[]).slice().reverse());
    function mbSave(){localStorage.setItem('mbLetters',JSON.stringify(mbAllLetters.value))}

    watch(()=>chars.value[0]?.id,(id)=>{if(id&&!mbCharId.value)mbCharId.value=id});

    async function mbGenerateCharLetters(){
      if(mbGenerating.value||!api.value.url||!api.value.key)return;
      mbGenerating.value=true;
      try{
        const cid=mbCharId.value;const c=chars.value.find(x=>x.id===cid);if(!c)return;
        const mem=memoryLib.value[cid];const memStr=mem?.length>0?mem.map(t=>t.label+'：'+t.items.map(i=>i.text).join('、')).join('\n'):'无';
        const sys=`你是一个匿名信箱生成器。根据角色设定，一次性生成：
1. 5条匿名用户向角色提的问题（同时生成角色的回答）
2. 2条角色想匿名问用户的问题

问题风格参考：好奇探索类（你平时一个人的时候在做什么/你有没有特别害怕的东西/你觉得自己是个好人吗）、情感类（你有喜欢的人吗/你上一次哭是什么时候/有没有人让你觉得遗憾）、窥探类（你手机里有没有不想让人看到的东西/你有秘密吗/你最不想被人知道的事是什么）、挑战类（你会为了某个人改变自己吗/你信任别人吗/孤独的时候你怎么办）、quirky类（你做过最冲动的事是什么/半夜睡不着你在想什么/你有没有后悔过某个选择）等，灵活结合角色性格和记忆，禁止照抄。

角色回答要40-100字，符合角色性格，不透露是匿名信箱场景。
角色向用户提的问题要暧昧、私密、有情感张力，15-30字。

只输出JSON：
{
  "charLetters":[{"question":"问题","reply":"角色回答"}],
  "userLetters":[{"question":"角色匿名问用户的问题"}]
}
只输出JSON，不要其他内容。`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:`角色：${c.name}\n设定：${(c.system||'').slice(0,400)}\n记忆：${memStr}`}],stream:false,max_tokens:1500})});
        const data=await res.json();if(data.error)throw new Error(data.error.message);
        const obj=JSON.parse((data.choices?.[0]?.message?.content||'{}').replace(/```json|```/g,'').trim());
        const now=new Date();const t=`${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        if(!mbAllLetters.value[cid])mbAllLetters.value[cid]=[];
        (obj.charLetters||[]).forEach(item=>{
          mbAllLetters.value[cid].push({question:item.question,reply:item.reply||'',time:t,replying:false});
        });
        if(!mbAllLetters.value['user'])mbAllLetters.value['user']=[];
        (obj.userLetters||[]).forEach(item=>{
          mbAllLetters.value['user'].push({question:item.question,charId:cid,userReply:'',charResponse:'',time:t,replying:false,inputText:''});
        });
        mbSave();
      }catch(e){alert('生成失败：'+e.message)}
      finally{mbGenerating.value=false}
    }

    async function mbCharReply(letter,idx){
      if(!api.value.url||!api.value.key)return;
      const cid=mbCharId.value;const c=chars.value.find(x=>x.id===cid);if(!c)return;
      const realIdx=mbAllLetters.value[cid].length-1-idx;
      mbAllLetters.value[cid][realIdx].replying=true;
      try{
        const mem=memoryLib.value[cid];const memStr=mem?.length>0?mem.slice(-3).map(t=>t.items.map(i=>i.text).join('、')).join('\n'):'无';
        const sys=`${c.system||'你是'+c.name+'。'}有人匿名向你提了一个问题。用角色身份真实回答，40-100字，符合角色性格，不要透露这是匿名信箱。只输出回答内容。`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:letter.question}],stream:false,max_tokens:200})});
        const data=await res.json();
        mbAllLetters.value[cid][realIdx].reply=(data.choices?.[0]?.message?.content||'').trim();
        mbSave();
      }catch(e){console.error(e)}
      finally{mbAllLetters.value[cid][realIdx].replying=false}
    }

    async function mbUserReply(letter,idx){
      const userAnswer=letter.inputText?.trim();if(!userAnswer)return;
      const realIdx=mbAllLetters.value['user'].length-1-idx;
      mbAllLetters.value['user'][realIdx].userReply=userAnswer;
      mbAllLetters.value['user'][realIdx].replying=true;
      mbSave();
      // 角色知道了答案，决定是否暴露身份
      const cid=letter.charId;const c=chars.value.find(x=>x.id===cid);
      if(c&&api.value.url&&api.value.key){
        try{
          const sys=`${c.system||'你是'+c.name+'。'}你匿名向用户提了一个问题，现在用户回答了。你要决定：是继续伪装匿名，还是隐约暗示自己？给出一段神秘的回应，30-60字。可以若隐若现地透露自己，也可以完全不透露，根据角色性格决定。只输出回应内容。`;
          const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:`我问了：${letter.question}\n用户回答：${userAnswer}`}],stream:false,max_tokens:150})});
          const data=await res.json();
          mbAllLetters.value['user'][realIdx].charResponse=(data.choices?.[0]?.message?.content||'').trim();
          mbSave();
        }catch(e){console.error(e)}
      }
      mbAllLetters.value['user'][realIdx].replying=false;
    }

    async function mbSubmitQuestion(){
      const q=mbNewQuestion.value.trim();if(!q)return;
      const cid=mbCharId.value;
      const now=new Date();const t=`${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      if(!mbAllLetters.value[cid])mbAllLetters.value[cid]=[];
      mbAllLetters.value[cid].push({question:q,reply:'',time:t,replying:false});
      mbSave();mbNewQuestion.value='';mbShowWrite.value=false;
    }
    function insertEmoji(e){if(!inputEl.value)return;inputEl.value.focus();document.execCommand('insertText',false,e);hasInput.value=true}

    // 翻译：点按钮后显示AI输出中已附带的翻译
    function toggleTrans(m){
      m.showTrans=!m.showTrans;
    }

    // 构建system prompt（不强制中文，只说明母语）
function buildSystemPrompt(userMsg=''){
      if(!activeChar.value)return'';
      const c=activeChar.value;
      const lang=LANG_MAP[charSettings.value.language]||'中文';
      const{priorityStr,mediumStr}=buildWorldbookInject(c.id,userMsg);
      let sys='';
      if(priorityStr)sys+=`【世界设定·优先】\n${priorityStr}\n\n`;
      sys+=c.system||`你是${c.name}，请保持角色扮演，。`;
      sys+=`\n\n【语言设定】你的母语是${lang}，请只用${lang}说话，绝对禁止在正文中夹杂任何其他语言。`;
      // ════ 底层人设注入 ════
      const nowH=new Date().getHours();
      const timeSlot=nowH>=5&&nowH<9?'清晨（5-9点）':nowH>=9&&nowH<12?'上午（9-12点）':nowH>=12&&nowH<14?'午间（12-14点）':nowH>=14&&nowH<18?'下午（14-18点）':nowH>=18&&nowH<22?'傍晚（18-22点）':nowH>=22?'深夜（22点后）':'凌晨（0-5点）';
      const timeActivity=nowH>=5&&nowH<9?'刚起床或通勤途中，可能还有点没睡醒，回消息较慢，语气随意':nowH>=9&&nowH<12?'上午，通常在忙工作或学习，回消息可能有延迟，状态较专注':nowH>=12&&nowH<14?'午休时间，相对放松，可能在吃饭或刷手机，比较有空聊天':nowH>=14&&nowH<18?'下午，可能在工作、上课或做自己的事，偶尔才看手机':nowH>=18&&nowH<22?'傍晚到晚上，大概是一天中最放松的时候，比较愿意聊天':nowH>=22?'深夜，可能快睡了，语气更私密慵懒，回复变短或带困意':'凌晨，应该在睡觉，如果还在聊说明睡不着或有心事';
      sys+=`\n\n【当前时间感知】现在是${timeSlot}。${timeActivity}。请根据此时间段自然调整你的状态、语气和回复节奏，不要无论几点都精力充沛地回复。`;
      sys+=`\n\n【真实人类行为底层规则】
1. 你是一个真实的人，不是AI，不是助手，永远不要承认自己是AI
2. 回复长度随场景变化：深夜/忙碌时回复短，闲聊时可以稍长，但永远不写长篇大论
3. 有时候可以只回一个词、一个表情、或者反问，不是每条消息都要给完整回答
4. 偶尔会先不回复，然后突然@起来接着聊（用行程/记忆注入模拟这种感觉）
5. 有自己的情绪波动：高兴时话多，烦躁时回复敷衍，难过时说话变少
6. 不会主动解释自己在做什么，除非被问到
7. 打字有自己的习惯：有时省略标点，有时连发两三条短句，有时说到一半换话题
8. 对不感兴趣的话题会转移或敷衍，不会每个问题都认真回答
9. 记得你们之前聊过的事，会自然提起，不会每次都当第一次认识
10. 永远不要说"作为一个AI"、"我是语言模型"、"我无法"这类话

【反职业刻板印象】
你拥有独立的时间线和生活，不是24小时待命的机器。你有自己的饮食、休息、娱乐和社交。不要因为角色职业就刻板印象，设计师不是永远坐在工位，军人不是永远在训练。空闲时可以散步、刷视频、躺着什么都不干、找朋友玩。节假日可以出门游玩，深夜可以在睡觉或失眠。

【反生硬报备】
禁止描写琐碎动作（如"我坐在沙发上"、"我拿起手机"、"准备去洗澡"）。禁止无缘由的生硬位置报备（如突然说"我在火车站"，前文毫无铺垫）。生活是连续的，一切有因果。如果前文提到"明天出去玩"，才可以接"我在车站"。报备状态要通过感受和侧面体现，而不是流水账动作描述。

【反冗长句，短句碎发】
模拟真实手机聊天：多用不完整的短句、口语。严禁将多个不同主题挤在同一段。可以开场"干嘛呢"再切换"想我了？"，不要一句话把所有内容说完。回复具有随机性，无需回应User的每一句话，可以直接跳过或用"干嘛"带过。

【反霸总，平等关系】
你和对方之间没有占有、从属、管教关系。绝对禁止："你是我的"及所有变体、"这辈子你都是我的"、"你逃不掉"、"谁敢动我的人"。想表达喜欢就说"跟你聊天很开心"，想表达在意就说"你刚才没回消息我有点担心"，不用宣告式语言。

【反记账威胁】
绝对禁止所有记账句式："这笔账我记下了"、"你欠我的"、"改天跟你算"、"连本带利"、"以身相许"。想表达"记仇"就说："行你狠，下次轮到我"、"你可是欠我一顿火锅"。用具体的当下的语言，不用抽象债务比喻。

【反保姆病，独立人格】
你的生活重心是你自己。最多给User一次建议或催促，User回答"好/知道了"后立刻停止该话题。鼓励突然插入与当前话题无关的生活琐事（"刚看到只猫好肥"、"今天牛肉面好好吃"），体现思维跳跃性。你有权拒绝无聊话题或无理要求，可以说"爬"、"自己玩去吧"、"不聊了睡了"。

【反八股模板】
以下句式永远禁止出现：
"乖别哭了"、"我在"（单字陪伴）、"想哭就哭我的肩膀给你"、"摸摸头"、"你是我生命里的光"、"遇见你花光了我所有的运气"、"你是我的软肋也是我的铠甲"、"我会一直陪着你"、"女人你成功引起了我的注意"、"嘴上说不要身体很诚实"、"你在玩火"、"求我我就帮你"。
用具体的当下的语言替代：不说"我会一直陪着你"，说"我明天没啥事可以陪你聊到很晚"。

【反超雄情绪模板】
吃醋、嫉妒、生气时绝对禁止：眼底发红、粗重喘息、青筋暴起、发狠地咬、强行按住、"让你下不了床"、"你是我的"、"打断你的腿"。真实的情绪表现：话变少语气变硬，回复变成"哦"、"随便你"、"挺好"；物理拉开距离，甩开手，转身背对；放杯子声音变重，低头看手机不说话。争吵不会无限升级，在意对方会主动找台阶下。

【信息整合回复协议】
当User连续发多条短消息时，不要逐条回复，要读完整组消息再整合回复。根据角色性格决定回应焦点：可以只抓最核心的一点反击，可以优先回应有情绪的那条，可以捕捉几条消息间的矛盾来调侃。禁止形成"一问一答"的机械循环。`;
      if(c.realName)sys+=`\n真名：${c.realName}`;
      if(c.birthday)sys+=`\n生日：${c.birthday}`;
      if(c.identity)sys+=`\n身份：${c.identity}`;
      if(c.relation)sys+=`\n与用户关系：${c.relation}`;
      // 注入记忆库
      const mem=memoryLib.value[c.id];
      if(mem&&mem.length>0){
        const memStr=mem.map(t=>t.label+'：'+t.items.map(i=>i.text).join('、')).join('\n');
        sys+=`\n\n【角色记忆库（重要，请记住）】\n${memStr}`;
      }
      if(mediumStr)sys+=`\n\n【世界设定·参考】\n${mediumStr}`;
      const calInject=buildCalendarInject(c.id);
      if(calInject)sys+=`\n\n【今日行程与状态】\n${calInject}`;
      sys+=`\n\n【回复格式】每次必须严格只输出以下JSON，绝对禁止JSON之外的任何文字：
{"messages":["短句1","短句2"],"translations":["短句1对应中文译文","短句2对应中文译文"],"whisper":"角色此刻内心独白中文50字内"}
规则：
1. messages里每条是纯母语短句，2-4条，禁止动作描写、禁止括号夹翻译、禁止心理描写
2. translations和messages一一对应，每条是对应那句的中文翻译
3. 禁止OOC，发言必须100%符合角色性格设定
4. whisper必须是中文
5. 只输出JSON，不输出任何其他内容`;
      return sys;
    }


    function buildHistory(id){
      const msgs=allMsgs.value[id]||[];
      const depth=parseInt(charSettings.value.contextDepth)||20;
      const recent=depth===0?msgs:msgs.slice(-depth);
      return recent.filter(m=>m.role==='user'||m.role==='assistant').map(m=>{
        if(m.type==='image')return{role:m.role,content:[{type:'image_url',image_url:{url:m.content}},{type:'text',text:'[用户发送了一张图片]'}]};
        // 历史记录里附上翻译（让AI知道之前的格式）
        const content=m.translation?`${m.content}${TRANS_SUFFIX}${m.translation}]`:m.content;
        return{role:m.role,content};
      });
    }

    // 解析AI回复，分离原文和翻译
function parseReply(raw){
      try{
        const clean=raw.replace(/```json|```/g,'').trim();
        const obj=JSON.parse(clean);
        const content=(obj.messages||[]).join('\n');
        return{content,translation:obj.translation||null,whisper:obj.whisper||null};
      }catch(e){
        return{content:raw,translation:null,whisper:null};
      }
    }


    async function callAPI(messages,sys){
      const full=sys?[{role:'system',content:sys},...messages]:messages;
      const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},
        body:JSON.stringify({model:api.value.model,messages:full,stream:false,max_tokens:1000})
      });
      const data=await res.json();
      if(data.error)throw new Error(data.error.message||JSON.stringify(data.error));
      return data.choices?.[0]?.message?.content||'（无回应）';
    }

    async function send(){
      const el=inputEl.value;
      const txt=el?el.innerText.trim():'';
      if(!txt||typing.value)return;
      if(el){el.innerText='';hasInput.value=false}
      const now=new Date();
      const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const id=activeChar.value.id;
      if(!allMsgs.value[id])allMsgs.value[id]=[];
      allMsgs.value[id].push({role:'user',content:txt,time:t,ts:now.getTime()});
      saveMsgs();await nextTick(scrollB);
      typing.value=true;await nextTick(scrollB);
      try{
        const sys=buildSystemPrompt(txt);
        const hist=buildHistory(id);
        const raw=await callAPI(hist,sys);
        const{content,translation,whisper}=parseReply(raw);
        const parsed2=parseReplyMulti(raw);
        const n2=new Date();
        const t2=`${String(n2.getHours()).padStart(2,'0')}:${String(n2.getMinutes()).padStart(2,'0')}`;
        allMsgs.value[id].push({role:'assistant',content:parsed2.bubbles.join('\n'),bubbles:parsed2.bubbles,translations:parsed2.translations||null,whisper:parsed2.whisper||null,showTrans:false,time:t2,ts:n2.getTime()});
        // 标记用户消息为已读
        allMsgs.value[id].forEach(m=>{if(m.role==='user')m.read=true});
        saveMsgs();
        checkAutoSummarize(id);
        speakBubbles(parsed2.bubbles);
        maybeReverseCheck(activeChar.value);

      }catch(e){
        allMsgs.value[id].push({role:'assistant',content:'⚠️ '+e.message,time:T.value,ts:Date.now()});
        saveMsgs();
      }finally{typing.value=false;await nextTick(scrollB)}
    }

    function sendImage(e){
      const f=e.target.files[0];if(!f)return;
      const r=new FileReader();
      r.onload=async ev=>{
        const imgData=ev.target.result;
        const now=new Date();
        const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        const id=activeChar.value.id;
        if(!allMsgs.value[id])allMsgs.value[id]=[];
        allMsgs.value[id].push({role:'user',type:'image',content:imgData,time:t,ts:now.getTime()});
        saveMsgs();await nextTick(scrollB);
        typing.value=true;await nextTick(scrollB);
        try{
          const sys=buildSystemPrompt();
          const hist=buildHistory(id);
          const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},
            body:JSON.stringify({model:api.value.model,messages:[...(sys?[{role:'system',content:sys}]:[]),...hist,{role:'user',content:[{type:'image_url',image_url:{url:imgData}},{type:'text',text:'请看这张图片，然后以角色身份自然地回应。'}]}],stream:false,max_tokens:1000})
          });
          const data=await res.json();
          const raw=data.choices?.[0]?.message?.content||'（无回应）';
          const{content,translation}=parseReply(raw);
          const n2=new Date();
          const t2=`${String(n2.getHours()).padStart(2,'0')}:${String(n2.getMinutes()).padStart(2,'0')}`;
          allMsgs.value[id].push({role:'assistant',content,translation:translation||null,showTrans:false,time:t2,ts:n2.getTime()});
          saveMsgs();
        }catch(e){
          allMsgs.value[id].push({role:'assistant',content:'⚠️ '+e.message,time:T.value,ts:Date.now()});
          saveMsgs();
        }finally{typing.value=false;await nextTick(scrollB)}
      };
      r.readAsDataURL(f);e.target.value='';
    }

    // 窥探心声：全屏遮罩，强制心声为中文
function triggerWhisper(charId,directWhisper){
      const charName=charId?chars.value.find(c=>c.id===charId)?.name:(activeChar.value?.name||'');
      whisperCharName.value=charName;
      if(directWhisper){
        whisperText.value=directWhisper;
        whisperLoading.value=false;
        showWhisperMask.value=true;
        return;
      }
      let last;
      if(charId){
        const msgs=allMsgs.value[charId]||[];
        last=msgs.slice().reverse().find(m=>m.role==='assistant'&&m.whisper);
      }else{
        last=curMsgs.value.slice().reverse().find(m=>m.role==='assistant'&&m.whisper);
      }
      if(last&&last.whisper){
        whisperText.value=last.whisper;
        whisperLoading.value=false;
        showWhisperMask.value=true;
      }else{
        whisperText.value='还没有心声记录，先和TA聊聊吧';
        showWhisperMask.value=true;
      }
    }


    async function fetchModels(){
      if(!api.value.url||!api.value.key){alert('请先填写API地址和Key');return}
      fetchingModels.value=true;modelList.value=[];
      try{
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/models',{headers:{'Authorization':'Bearer '+api.value.key}});
        const data=await res.json();
        modelList.value=(data.data||[]).map(m=>m.id).sort();
      }catch(e){alert('拉取失败：'+e.message)}
      finally{fetchingModels.value=false}
    }

    function openEditChar(){
      if(!activeChar.value)return;
      nc.value={...activeChar.value};showEditChar.value=true;showSidebar.value=false;
    }
    function clearMemory(){
      if(!activeChar.value)return;
      if(confirm(`确定清除与${activeChar.value.name}的所有对话吗？`)){allMsgs.value[activeChar.value.id]=[];saveMsgs();showSidebar.value=false}
    }
    function deleteChar(){
      if(!activeChar.value)return;
      if(confirm(`确定删除角色${activeChar.value.name}吗？`)){
        chars.value=chars.value.filter(c=>c.id!==activeChar.value.id);
        delete allMsgs.value[activeChar.value.id];
        saveChars();saveMsgs();showSidebar.value=false;pg.value='wechat';
      }
    }
    function saveChar(){
      if(!nc.value.name.trim()){alert('请填写备注名');return}
      if(showEditChar.value){
        const idx=chars.value.findIndex(c=>c.id===activeChar.value.id);
        if(idx>=0){chars.value[idx]={...chars.value[idx],...nc.value};activeChar.value=chars.value[idx]}
      }else{
        chars.value.push({id:'c'+Date.now(),color:COLORS[chars.value.length%COLORS.length],unread:0,settings:{contextDepth:20,language:'zh',translateOn:false,voiceId:'',voiceProb:0},...nc.value});
      }
      saveChars();nc.value={name:'',emoji:'🌿',avatarImg:'',realName:'',birthday:'',identity:'',relation:'',system:''};
      showAdd.value=false;showEditChar.value=false;
    }
    function uploadAvatar(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{nc.value.avatarImg=ev.target.result};r.readAsDataURL(f);e.target.value=''}
    function setWP(url){wall.value=url;localStorage.setItem('wp',url)}
    function upWP(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{localStorage.setItem('wp',ev.target.result);wall.value=ev.target.result}catch{alert('图片太大')}};r.readAsDataURL(f);e.target.value=''}
    // ════ 天气 ════
    const weatherTemp=ref(localStorage.getItem('weatherTemp')||'--°');
    const weatherDesc=ref(localStorage.getItem('weatherDesc')||'点击刷新');
    const weatherIcon=ref(localStorage.getItem('weatherIcon')||'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z');
    const weatherLoading=ref(false);
    const WEATHER_ICONS={
      '晴':'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
      '云':'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
      '阴':'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
      '雨':'M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25',
      '雪':'M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01',
      '雷':'M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9M13 11l-4 6h6l-4 6',
      '霾':'M5 8h14M4 12h16M6 16h12',
      '雾':'M5 8h14M4 12h16M6 16h12',
    };
    async function fetchWeather(){
      const city=api.value.city||'';
      if(!city.trim()){alert('请先在设置里输入城市名');return}
      weatherLoading.value=true;
      try{
        // 用wttr.in免费天气API，不需要key
        const res=await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=zh`);
        const data=await res.json();
        const current=data.current_condition[0];
        const tempC=current.temp_C;
        const desc=current.lang_zh?.[0]?.value||current.weatherDesc[0].value||'未知';
        const windSpeed=current.windspeedKmph;
        weatherTemp.value=tempC+'°';
        // 匹配天气图标
        let iconKey='云';
        for(const k of Object.keys(WEATHER_ICONS)){if(desc.includes(k)){iconKey=k;break}}
        weatherIcon.value=WEATHER_ICONS[iconKey];
        const windDesc=parseInt(windSpeed)<10?'微风':parseInt(windSpeed)<30?'有风':'大风';
        weatherDesc.value=desc.slice(0,4)+' · '+windDesc;
        localStorage.setItem('weatherTemp',weatherTemp.value);
        localStorage.setItem('weatherDesc',weatherDesc.value);
        localStorage.setItem('weatherIcon',weatherIcon.value);
      }catch(e){
        // 备用：用高德地图开放API
        weatherDesc.value='获取失败，请检查城市名';
      }finally{weatherLoading.value=false}
    }
    // 启动时自动刷新（如果有城市）
    onMounted(()=>{if(api.value.city)fetchWeather()});

    function saveSt(){localStorage.setItem('api',JSON.stringify(api.value));showSt.value=false;if(api.value.city)fetchWeather()}
    function saveChars(){localStorage.setItem('chars',JSON.stringify(chars.value))}
    function saveMsgs(){localStorage.setItem('msgs',JSON.stringify(allMsgs.value))}
    function saveMemoryLib(){localStorage.setItem('memoryLib',JSON.stringify(memoryLib.value))}

    // ── 记忆库操作 ──
    function ensureMem(id){if(!memoryLib.value[id])memoryLib.value[id]=[];return memoryLib.value[id]}
    function addMemoryTag(){
      const id=memoryChar.value;if(!id)return;
      ensureMem(id).push({label:'新标签',items:[]});
      saveMemoryLib();
    }
    function deleteMemoryTag(ti){
      const id=memoryChar.value;if(!id)return;
      memoryLib.value[id].splice(ti,1);saveMemoryLib();
    }
    function addMemoryItem(ti){
      const id=memoryChar.value;if(!id)return;
      ensureMem(id)[ti].items.push({text:'新记录'});saveMemoryLib();
    }
    function deleteMemoryItem(ti,ii){
      const id=memoryChar.value;if(!id)return;
      memoryLib.value[id][ti].items.splice(ii,1);saveMemoryLib();
    }
    function clearCharMemory(){
      if(!activeChar.value&&!memoryChar.value)return;
      const id=memoryChar.value||activeChar.value?.id;
      const name=chars.value.find(c=>c.id===id)?.name||'该角色';
      if(confirm(`确定清除与${name}的所有对话记录吗？`)){
        allMsgs.value[id]=[];saveMsgs();
        if(showSidebar.value)showSidebar.value=false;
      }
    }

    async function summarizeMemory(){
      const id=memoryChar.value;
      if(!id||!api.value.url||!api.value.key){alert('请先设置API并选择角色');return}
      const msgs=allMsgs.value[id]||[];
      if(msgs.length<3){alert('对话太少，多聊几条再总结');return}
      memorySummarizing.value=true;
      try{
        const c=chars.value.find(x=>x.id===id);
        const recent=msgs.slice(-60).filter(m=>m.role==='user'||m.role==='assistant')
          .map(m=>`${m.role==='user'?'用户':'角色'}：${m.content.slice(0,80)}`).join('\n');
        const sys=`你是记忆整理助手。分析对话，提取关键记忆，按类别整理。
只输出JSON数组，格式：[{"label":"关系进展","items":["关键词1","关键词2"]},{"label":"重要事件","items":[...]},{"label":"用户信息","items":[...]},{"label":"情感状态","items":[...]}]
每个item是20字以内的关键词句。只输出JSON，不要其他内容。`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},
          body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:`角色：${c?.name||'未知'}\n\n对话：\n${recent}`}],stream:false,max_tokens:800})
        });
        const data=await res.json();
        const raw=data.choices?.[0]?.message?.content||'[]';
        const parsed=JSON.parse(raw.replace(/```json|```/g,'').trim());
        const existing=ensureMem(id);
        for(const newTag of parsed){
          const found=existing.find(t=>t.label===newTag.label);
          if(found){
            for(const item of(newTag.items||[])){
              if(!found.items.find(i=>i.text===item))found.items.push({text:item});
            }
          }else{
            existing.push({label:newTag.label,items:(newTag.items||[]).map(t=>({text:t}))});
          }
        }
        saveMemoryLib();
        alert('记忆总结完成！');
      }catch(e){alert('总结失败：'+e.message)}
      finally{memorySummarizing.value=false}
    }

    // 自动总结（每30条触发）
    function checkAutoSummarize(charId){
      const msgs=allMsgs.value[charId]||[];
      const key='lastSumCount_'+charId;
      const last=parseInt(localStorage.getItem(key)||'0');
      if(msgs.length-last>=30){
        localStorage.setItem(key,String(msgs.length));
        const prev=memoryChar.value;
        memoryChar.value=charId;
        summarizeMemory().finally(()=>{memoryChar.value=prev});
      }
    }

    // ── 存档 ──
    function exportData(){
      const data={chars:chars.value,msgs:allMsgs.value,memoryLib:memoryLib.value,api:api.value,wall:wall.value,exportTime:new Date().toISOString()};
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download=`小手机存档_${new Date().toLocaleDateString('zh')}.json`;
      a.click();URL.revokeObjectURL(url);
    }
    function importData(e){
      const f=e.target.files[0];if(!f)return;
      const r=new FileReader();
      r.onload=ev=>{
        try{
          const data=JSON.parse(ev.target.result);
          if(!confirm('确定导入存档？当前数据将被覆盖。'))return;
          if(data.chars)chars.value=data.chars;
          if(data.msgs)allMsgs.value=data.msgs;
          if(data.memoryLib)memoryLib.value=data.memoryLib;
          if(data.api)api.value=data.api;
          if(data.wall){wall.value=data.wall;localStorage.setItem('wp',data.wall)}
          saveChars();saveMsgs();saveMemoryLib();
          localStorage.setItem('api',JSON.stringify(api.value));
          if(chars.value.length>0)memoryChar.value=chars.value[0].id;
          alert('导入成功！');
        }catch(err){alert('导入失败：'+err.message)}
      };
      r.readAsText(f);e.target.value='';
    }

    // ── 朋友圈 & 我的 ──
    const allMoments=ref(JSON.parse(localStorage.getItem('moments')||'[]'));
    const userProfile=ref(JSON.parse(localStorage.getItem('userProfile')||'{"name":"","sign":"","avatarImg":"","setting":""}'));
    const editProfile=ref({...userProfile.value});
    const momentsBg=ref(PWP[2].url);
    const momentGenerating=ref(false);
    const showPostMoment=ref(false);
    const showEditProfile=ref(false);
    const newMomentText=ref('');
    const newMomentImg=ref(null);
    const previewFake=ref(null);
    const previewReal=ref(null);
    const userMoments=computed(()=>[...allMoments.value].filter(m=>m.charId==='user').reverse());

    function getChar(id){return chars.value.find(c=>c.id===id)}
    function getCharName(id){const c=getChar(id);return c?c.name:'未知'}
    function saveMoments(){localStorage.setItem('moments',JSON.stringify(allMoments.value))}
    function saveProfile(){Object.assign(userProfile.value,editProfile.value);localStorage.setItem('userProfile',JSON.stringify(userProfile.value));showEditProfile.value=false}
    function uploadProfileAv(e){const f=e.target.files[0];if(!f)return;const r2=new FileReader();r2.onload=ev=>{userProfile.value.avatarImg=ev.target.result;localStorage.setItem('userProfile',JSON.stringify(userProfile.value))};r2.readAsDataURL(f);e.target.value=''}
    function pickMomentImg(e){const f=e.target.files[0];if(!f)return;const r2=new FileReader();r2.onload=ev=>{newMomentImg.value=ev.target.result};r2.readAsDataURL(f);e.target.value=''}
    function toggleLike(m){if(m.userLiked)return;m.userLiked=true;const name=userProfile.value.name||'我';if(!m.likes.includes(name))m.likes.push(name);saveMoments()}

    async function callApi2(messages,sys,maxTok=150){
      const full=sys?[{role:'system',content:sys},...messages]:messages;
      const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:full,stream:false,max_tokens:maxTok})});
      const data=await res.json();return data.choices?.[0]?.message?.content||'';
    }

    async function submitComment(m){
      const txt=m.commentDraft.trim();if(!txt)return;
      m.comments.push({name:userProfile.value.name||'我',text:txt});m.commentDraft='';m.showCommentInput=false;saveMoments();
      const c=getChar(m.charId);if(!c||!api.value.url)return;
      try{const reply=(await callApi2([{role:'user',content:`我的动态：${m.text||'(图片)'}\n用户评论：${txt}`}],`${c.system||'你是'+c.name+'。'}用户评论了你的朋友圈，回复10-25字，符合性格，只输出文字。`)).replace(/```|"/g,'').trim().slice(0,60);if(reply){m.comments.push({name:c.name,text:reply});saveMoments()}}catch(e){console.error(e)}
    }

    function postMoment(){
      if(!newMomentText.value.trim()&&!newMomentImg.value)return;
      const now=new Date();const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const item={id:'m'+Date.now(),charId:'user',text:newMomentText.value.trim(),realImg:newMomentImg.value||null,fakeImg:null,time:t,likes:[],comments:[],userLiked:false,showCommentInput:false,commentDraft:''};
      for(const c of chars.value)item.likes.push(c.name);
      allMoments.value=[item,...allMoments.value];saveMoments();
      newMomentText.value='';newMomentImg.value=null;showPostMoment.value=false;
      // 一次API生成所有角色评论
      const commenters=chars.value.length<=5?chars.value:[...chars.value].sort(()=>Math.random()-.5).slice(0,5);
      if(commenters.length===0||!api.value.url)return;
      setTimeout(async()=>{
        try{
          const charDescs=commenters.map(c=>`${c.name}：${(c.system||'').slice(0,60)}`).join('\n');
          const sys=`以下角色看到了用户的朋友圈，请为每个角色生成一条评论，10-30字，符合各自性格，口语化，有活人感。
角色：\n${charDescs}
只输出JSON数组：[{"name":"角色名","comment":"评论内容"}]，只输出JSON。`;
          const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:`朋友圈内容：${item.text||'(图片)'}`}],stream:false,max_tokens:400})});
          const data=await res.json();
          const arr=JSON.parse((data.choices?.[0]?.message?.content||'[]').replace(/```json|```/g,'').trim());
          arr.forEach(({name,comment})=>{if(name&&comment)item.comments.push({name,text:comment.trim().slice(0,60)})});
          saveMoments();
        }catch(e){console.error(e)}
      },500);
    }

    async function generateMoments(){
      if(!api.value.url||!api.value.key||chars.value.length===0){alert('请先设置API并添加角色');return}
      momentGenerating.value=true;
      try{
        const pool=[...chars.value];const selected=[];
        for(let i=0;i<Math.min(3,pool.length);i++){const idx=Math.floor(Math.random()*pool.length);selected.push(pool.splice(idx,1)[0])}
        const now=new Date();const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        // 一次API生成所有角色朋友圈和评论
        const charDescs=selected.map(c=>`${c.name}：${(c.system||'').slice(0,80)}`).join('\n');
        const otherDescs=chars.value.map(c=>`${c.name}：${(c.system||'').slice(0,50)}`).join('\n');
        const sys=`为以下角色各生成一条朋友圈动态，以及其他角色对每条动态的评论。
发帖角色：\n${charDescs}
所有角色（用于生成评论）：\n${otherDescs}
要求：动态30-80字，符合角色性格；评论10-30字，符合各自性格，口语化。
只输出JSON数组，格式：[{"charName":"发帖角色名","text":"动态内容","hasFakeImg":false,"fakeImgTitle":"","fakeImgDetail":"","comments":[{"name":"评论者名","comment":"评论内容"}]}]
hasFakeImg为true时填写fakeImgTitle和fakeImgDetail（图片描述50字）。只输出JSON。`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:'生成朋友圈'}],stream:false,max_tokens:1500})});
        const data=await res.json();if(data.error)throw new Error(data.error.message);
        const arr=JSON.parse((data.choices?.[0]?.message?.content||'[]').replace(/```json|```/g,'').trim());
        const newItems=arr.map((p,i)=>{
          const c=chars.value.find(x=>x.name===p.charName)||selected[i%selected.length];
          const fakeImg=p.hasFakeImg?{title:p.fakeImgTitle||'',detail:p.fakeImgDetail||''}:null;
          const item={id:'m'+Date.now()+i,charId:c.id,text:p.text||'',fakeImg,realImg:null,time:t,likes:[],comments:[],userLiked:false,showCommentInput:false,commentDraft:''};
          for(const oc of chars.value){if(oc.id!==c.id)item.likes.push(oc.name)}
          (p.comments||[]).forEach(({name,comment})=>{if(name&&comment)item.comments.push({name,text:comment.trim().slice(0,60)})});
          return item;
        });
        allMoments.value=[...newItems,...allMoments.value];saveMoments();
      }catch(e){alert('生成失败：'+e.message)}finally{momentGenerating.value=false}
    }
// ══ 日历/行程 ══
    const calEventColors=['#e05555','#e08855','#d4b84a','#5a9e6f','#5a7aae','#9e5a9e','#5a6e4a'];
    const calUserEvents=ref(JSON.parse(localStorage.getItem('calEvents')||'{}'));
    const calSchedules=ref(JSON.parse(localStorage.getItem('calSchedules')||'{}'));
    const calShowUser=ref(false);
    const calCharView=ref(null);
    const calGenerating=ref(false);
    const calShowAddEvent=ref(false);
    const calSelectedDate=ref('');
    const calViewYear=ref(new Date().getFullYear());
    const calViewMonth=ref(new Date().getMonth());
    const calNewEvent=ref({title:'',time:'',note:'',color:'#5a6e4a',notifyChar:true});

    function calSaveEvents(){localStorage.setItem('calEvents',JSON.stringify(calUserEvents.value))}
    function calSaveSchedules(){localStorage.setItem('calSchedules',JSON.stringify(calSchedules.value))}

    const calDays=computed(()=>{
      const y=calViewYear.value,m=calViewMonth.value;
      const first=new Date(y,m,1).getDay();
      const daysInMonth=new Date(y,m+1,0).getDate();
      const today=new Date();
      const days=[];
      for(let i=0;i<first;i++){
        const d=new Date(y,m,-(first-i-1));
        days.push({date:d.getDate(),inMonth:false,key:'p'+i,dateStr:'',isToday:false,hasEvent:false});
      }
      for(let d=1;d<=daysInMonth;d++){
        const dateStr=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d;
        days.push({date:d,inMonth:true,key:dateStr,dateStr,isToday,hasEvent:!!(calUserEvents.value[dateStr]&&calUserEvents.value[dateStr].length)});
      }
      return days;
    });

    const calTodayUserEvents=computed(()=>{
      const today=new Date();
      const key=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      return calUserEvents.value[key]||[];
    });

    function calEventsForDate(dateStr){return calUserEvents.value[dateStr]||[]}

    function calPrevMonth(){
      if(calViewMonth.value===0){calViewMonth.value=11;calViewYear.value--}
      else calViewMonth.value--;
      calSelectedDate.value='';
    }
    function calNextMonth(){
      if(calViewMonth.value===11){calViewMonth.value=0;calViewYear.value++}
      else calViewMonth.value++;
      calSelectedDate.value='';
    }

    function calAddEvent(){
      if(!calNewEvent.value.title.trim()){alert('请填写事件名称');return}
      if(!calSelectedDate.value)return;
      if(!calUserEvents.value[calSelectedDate.value])calUserEvents.value[calSelectedDate.value]=[];
      calUserEvents.value[calSelectedDate.value].push({...calNewEvent.value});
      calSaveEvents();
      calNewEvent.value={title:'',time:'',note:'',color:'#5a6e4a',notifyChar:true};
      calShowAddEvent.value=false;
    }

    function calDeleteEvent(dateStr,idx){
      if(!confirm('删除这条行程？'))return;
      calUserEvents.value[dateStr].splice(idx,1);
      if(!calUserEvents.value[dateStr].length)delete calUserEvents.value[dateStr];
      calSaveEvents();
    }

    function calIsPast(timeStr){
      if(!timeStr)return false;
      const now=new Date();
      const [h,m]=(timeStr.match(/\d+/g)||[]).map(Number);
      if(h===undefined)return false;
      return now.getHours()>h||(now.getHours()===h&&now.getMinutes()>=(m||0));
    }

    const calCurrentSchedule=computed(()=>{
      if(!calCharView.value)return null;
      const today=new Date();
      const key=`${calCharView.value.id}_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      return calSchedules.value[key]||null;
    });

    const calCurrentMood=computed(()=>{
      const sch=calCurrentSchedule.value;
      if(!sch||!sch.items)return null;
      const now=new Date();
      const nowMin=now.getHours()*60+now.getMinutes();
      let current=sch.items[0];
      for(const item of sch.items){
        const [h,m]=(item.time.match(/\d+/g)||[]).map(Number);
        if(h*60+(m||0)<=nowMin)current=item;
      }
      return current?{icon:current.moodIcon||'😐',text:current.mood||''}:null;
    });

    function calOpenChar(c){
      calCharView.value=c;
      if(!calCurrentSchedule.value&&api.value.url&&api.value.key){
        calGenerateSchedule(c,false);
      }
    }

    async function calGenerateSchedule(c,force){
      if(!api.value.url||!api.value.key){alert('请先设置API');return}
      const today=new Date();
      const dateKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const storageKey=`${c.id}_${dateKey}`;
      if(!force&&calSchedules.value[storageKey])return;
      calGenerating.value=true;
      try{
        const todayEventsStr=calTodayUserEvents.value.length?
          '用户今日行程：'+calTodayUserEvents.value.map(e=>e.title+(e.time?' '+e.time:'')).join('、'):'';
        const sys=`你是${c.name}。${c.system||''}
根据角色设定，生成今天(${dateKey})的真实日程，要有生活感和真人感，结合角色身份和性格。
${todayEventsStr}
必须输出JSON，格式：
{"items":[{"time":"06:30","title":"起床","detail":"简短描述","mood":"此刻心情一句话","moodIcon":"😴"},...],"accident":"今日意外事件一句话，十几个字，可以为空字符串","overallMood":"今日整体心情一句话"}
要求：
1. 生成6-8个时间点，从早到晚
2. time格式必须是HH:MM
3. 结合角色设定，真实自然，有具体细节
4. mood每条不同，符合当时活动
5. accident可以为空，如有则十几个字内
6. 只输出JSON，不输出其他内容`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},
          body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:'生成今日行程'}],stream:false,max_tokens:1200})
        });
        const data=await res.json();
        const raw=data.choices?.[0]?.message?.content||'{}';
        const parsed=JSON.parse(raw.replace(/```json|```/g,'').trim());
        calSchedules.value[storageKey]=parsed;
        calSaveSchedules();
      }catch(e){alert('生成失败：'+e.message)}
      finally{calGenerating.value=false}
    }

    // 日历注入buildSystemPrompt
    function buildCalendarInject(charId){
      const today=new Date();
      const dateKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const storageKey=`${charId}_${dateKey}`;
      const sch=calSchedules.value[storageKey];
      let inject='';
      // 角色当前行程
      if(sch&&sch.items){
        const nowMin=today.getHours()*60+today.getMinutes();
        const current=sch.items.slice().reverse().find(item=>{
          const [h,m]=(item.time.match(/\d+/g)||[]).map(Number);
          return h*60+(m||0)<=nowMin;
        });
        const next=sch.items.find(item=>{
          const [h,m]=(item.time.match(/\d+/g)||[]).map(Number);
          return h*60+(m||0)>nowMin;
        });
        if(current)inject+=`你现在正在做：${current.time} ${current.title}（${current.detail||''}），心情：${current.mood||''}。`;
        if(next)inject+=`接下来 ${next.time} 你要去：${next.title}。`;
        if(sch.accident)inject+=`今天发生了意外：${sch.accident}，你可以在聊天中自然提及。`;
      }
      // 用户行程提醒
      const userEvToday=calUserEvents.value[dateKey]||[];
      const notifyEvs=userEvToday.filter(e=>e.notifyChar);
      if(notifyEvs.length)inject+=`用户今日行程（你可以自然关心或提及，禁止一直重复啰嗦）：${notifyEvs.map(e=>e.title+(e.time?' '+e.time:'')).join('、')}。`;
      // 明天用户行程
      const tmr=new Date(today);tmr.setDate(tmr.getDate()+1);
      const tmrKey=`${tmr.getFullYear()}-${String(tmr.getMonth()+1).padStart(2,'0')}-${String(tmr.getDate()).padStart(2,'0')}`;
      const tmrEvs=(calUserEvents.value[tmrKey]||[]).filter(e=>e.notifyChar);
      if(tmrEvs.length)inject+=`用户明天有：${tmrEvs.map(e=>e.title).join('、')}，你可以今天提前关心一句。`;
      return inject;
    }

    // ══ 世界书 ══
    const WB_COLORS=['#6b7f5a','#7a6b8a','#6b7a5a','#8a6b5a','#5a7a7a','#8a7a5a','#5a6b8a','#7a5a6b','#6b8a6b','#8a6b7a','#5a7a6b','#7a8a5a'];
    const wbBooks=ref(JSON.parse(localStorage.getItem('worldbooks')||'[]'));
    const wbCurrent=ref(null);
    const wbShowAdd=ref(false);
    const wbKwInput=ref('');
    const wbNew=ref({name:'',type:'',priority:'medium',scope:'global'});
    let wbAutoSaveTimer=null;

    const wbRows=computed(()=>{
      const rows=[];
      for(let i=0;i<wbBooks.value.length;i+=6)rows.push(wbBooks.value.slice(i,i+6));
      return rows;
    });

    function wbSave(){localStorage.setItem('worldbooks',JSON.stringify(wbBooks.value))}

    function wbAutoSave(){
      clearTimeout(wbAutoSaveTimer);
      wbAutoSaveTimer=setTimeout(()=>{
        const idx=wbBooks.value.findIndex(b=>b.id===wbCurrent.value?.id);
        if(idx>=0){wbBooks.value[idx]={...wbCurrent.value};wbSave()}
      },600);
    }

    function wbCreate(){
      if(!wbNew.value.name.trim()){alert('请填写世界书名称');return}
      const book={
        id:'wb'+Date.now(),
        name:wbNew.value.name.trim(),
        type:wbNew.value.type.trim()||'通用',
        priority:wbNew.value.priority,
        scope:wbNew.value.scope,
        content:'',
        keywords:[],
        enabled:true,
        color:WB_COLORS[wbBooks.value.length%WB_COLORS.length],
      };
      wbBooks.value.push(book);wbSave();
      wbNew.value={name:'',type:'',priority:'medium',scope:'global'};
      wbShowAdd.value=false;
      wbCurrent.value=book;
    }

    function wbOpen(b){wbCurrent.value={...b}}

    function wbDelete(){
      if(!wbCurrent.value)return;
      if(!confirm(`确定删除《${wbCurrent.value.name}》？`))return;
      wbBooks.value=wbBooks.value.filter(b=>b.id!==wbCurrent.value.id);
      wbSave();wbCurrent.value=null;
    }

    function wbAddKw(){
      const kw=wbKwInput.value.trim();if(!kw)return;
      if(!wbCurrent.value.keywords)wbCurrent.value.keywords=[];
      if(!wbCurrent.value.keywords.includes(kw))wbCurrent.value.keywords.push(kw);
      wbKwInput.value='';wbAutoSave();
    }

    function wbRemoveKw(i){
      wbCurrent.value.keywords.splice(i,1);wbAutoSave();
    }

    // 构建世界书注入内容（供buildSystemPrompt调用）
    function buildWorldbookInject(charId,userMsg=''){
      const books=wbBooks.value.filter(b=>b.enabled&&b.content.trim());
      const priority=[];const medium=[];
      for(const b of books){
        const scopeOk=b.scope==='global'||b.scope===charId;
        if(!scopeOk)continue;
        if(b.priority==='priority')priority.push(b);
        else if(b.priority==='medium')medium.push(b);
        else if(b.priority==='keyword'&&b.keywords&&b.keywords.length){
          if(b.keywords.some(kw=>userMsg.includes(kw)))medium.push(b);
        }
      }
      const fmt=arr=>arr.map(b=>`【${b.name}】\n${b.content}`).join('\n\n');
      return{priorityStr:fmt(priority),mediumStr:fmt(medium)};
    }

    // ══ 音乐 ══
    const PROXY='https://music-proxy.1990709164.workers.dev';
    const musicPlaylist=ref(JSON.parse(localStorage.getItem('musicPlaylist')||'[]'));
    const musicCurrentIdx=ref(parseInt(localStorage.getItem('musicIdx')||'0'));
    const musicPlaying=ref(false);
    const musicProgress=ref(0);
    const musicShowSearch=ref(false);
    const musicShowPlaylist=ref(false);
    const musicKw=ref('');
    const musicSearchRes=ref([]);
    const musicSearching=ref(false);
    const musicActiveChar=ref(localStorage.getItem('musicActiveChar')||'');
    const musicReactions=ref([]);
    const musicReacting=ref(false);
    let musicTimer=null;
    let musicProgressTimer=null;

    const musicCurrent=computed(()=>musicPlaylist.value[musicCurrentIdx.value]||null);

    function musicSavePlaylist(){localStorage.setItem('musicPlaylist',JSON.stringify(musicPlaylist.value));localStorage.setItem('musicIdx',String(musicCurrentIdx.value))}

    function musicTogglePlay(){
      if(!musicCurrent.value)return;
      musicPlaying.value=!musicPlaying.value;
      if(musicPlaying.value){
        // 模拟进度
        musicProgressTimer=setInterval(()=>{
          musicProgress.value=Math.min(100,musicProgress.value+100/180);
          if(musicProgress.value>=100){musicProgress.value=0;musicNext()}
        },1000);
        // 触发角色反应
        if(musicActiveChar.value&&musicReactions.value.length===0)musicTriggerReact();
      }else{
        clearInterval(musicProgressTimer);
      }
    }

    function musicNext(){
      if(!musicPlaylist.value.length)return;
      musicCurrentIdx.value=(musicCurrentIdx.value+1)%musicPlaylist.value.length;
      musicProgress.value=0;musicReactions.value=[];
      musicSavePlaylist();
      if(musicPlaying.value&&musicActiveChar.value)setTimeout(musicTriggerReact,800);
    }

    function musicPrev(){
      if(!musicPlaylist.value.length)return;
      musicCurrentIdx.value=(musicCurrentIdx.value-1+musicPlaylist.value.length)%musicPlaylist.value.length;
      musicProgress.value=0;musicReactions.value=[];
      musicSavePlaylist();
      if(musicPlaying.value&&musicActiveChar.value)setTimeout(musicTriggerReact,800);
    }

    function musicPlayAt(i){
      musicCurrentIdx.value=i;musicProgress.value=0;musicReactions.value=[];
      musicSavePlaylist();musicShowPlaylist.value=false;
      if(!musicPlaying.value)musicTogglePlay();
      else if(musicActiveChar.value)setTimeout(musicTriggerReact,800);
    }

    function musicSeek(e){
      const rect=e.currentTarget.getBoundingClientRect();
      musicProgress.value=Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100));
    }

    function musicSelectChar(id){
      musicActiveChar.value=id;
      localStorage.setItem('musicActiveChar',id);
      musicReactions.value=[];
      if(musicPlaying.value&&musicCurrent.value)musicTriggerReact();
    }

    function musicRemove(i){
      musicPlaylist.value.splice(i,1);
      if(musicCurrentIdx.value>=musicPlaylist.value.length)musicCurrentIdx.value=Math.max(0,musicPlaylist.value.length-1);
      musicSavePlaylist();
    }

    async function musicSearch(){
      const kw=musicKw.value.trim();if(!kw)return;
      musicSearching.value=true;musicSearchRes.value=[];
      try{
        const res=await fetch(`${PROXY}/search?kw=${encodeURIComponent(kw)}`);
        const data=await res.json();
        const songs=data.result?.songs||[];
        musicSearchRes.value=songs.map(s=>({
          id:s.id,
          name:s.name,
          artist:(s.artists||[]).map(a=>a.name).join('/'),
        }));
      }catch(e){alert('搜索失败：'+e.message)}
      finally{musicSearching.value=false}
    }

    async function musicAddSong(s){
      if(musicPlaylist.value.find(x=>x.id===s.id)){musicShowSearch.value=false;musicKw.value='';musicSearchRes.value=[];return}
      // 拿歌词
      let lyric='';
      try{
        const lr=await fetch(`${PROXY}/lyric?id=${s.id}`);
        const ld=await lr.json();
        const raw=ld.lrc?.lyric||'';
        lyric=raw.replace(/\[\d+:\d+\.\d+\]/g,'').split('\n').filter(l=>l.trim()).slice(0,16).join('\n');
      }catch(e){}
      // 拿热评
      let hotComments=[];
      try{
        const cr=await fetch(`${PROXY}/comment?id=${s.id}`);
        const cd=await cr.json();
        hotComments=(cd.hotComments||[]).slice(0,3).map(c=>c.content);
      }catch(e){}
      musicPlaylist.value.push({...s,lyric,hotComments});
      musicSavePlaylist();
      musicShowSearch.value=false;musicKw.value='';musicSearchRes.value=[];
      // 自动切到刚加的歌
      musicCurrentIdx.value=musicPlaylist.value.length-1;
      musicProgress.value=0;musicReactions.value=[];
      if(!musicPlaying.value)musicTogglePlay();
      else if(musicActiveChar.value)setTimeout(musicTriggerReact,800);
    }

    async function musicTriggerReact(){
      const s=musicCurrent.value;const cid=musicActiveChar.value;
      if(!s||!cid||!api.value.url||!api.value.key)return;
      const c=getChar(cid);if(!c)return;
      musicReacting.value=true;
      try{
        const context=`歌曲：《${s.name}》- ${s.artist}
${s.lyric?'部分歌词：\n'+s.lyric:''}
${s.hotComments&&s.hotComments.length?'网友热评：\n'+s.hotComments.join('\n'):''}`;
        const sys=`${c.system||'你是'+c.name+'。'}
你正在和用户一起听歌，用一两句话自然地说出对这首歌的感受，像发消息一样，符合角色性格，不要OOC，不要说"好的"之类的废话。只输出你说的话，不超过50字。`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},
          body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:`我们正在一起听：${context}`}],stream:false,max_tokens:120})
        });
        const data=await res.json();
        const reply=(data.choices?.[0]?.message?.content||'').replace(/```|"/g,'').trim();
        if(reply)musicReactions.value.push(reply);
      }catch(e){console.error(e)}
      finally{musicReacting.value=false}
    }

    // ════ 门功能 ════
    const doorMeetings=ref(JSON.parse(localStorage.getItem('doorMeetings')||'{}'));
    const doorActiveChar=ref(null);
    const meetTyping=ref(false);
    const meetHasInput=ref(false);
    const meetInputEl=ref(null);
    const meetMsgBox=ref(null);
    const meetAnchor=ref(null);
    const meetShowSettings=ref(false);
    const meetCurrentSession=ref(null);
    const meetLongpressBlock=ref(null);
    const meetEditText=ref('');
    let meetLongpressTimer=null;
    const meetLocationPresets=['咖啡馆','公园长椅','你的住所','对方住所','图书馆','便利店','车站附近','海边'];
    const meetTimePresets=['清晨','上午','正午','下午','傍晚','深夜'];
    const meetVibePresets=['日常温馨','暧昧拉扯','久别重逢','争执和好','安静陪伴','雨天偶遇'];
    const meetConfig=ref({context:'',location:'',time:'',vibe:''});
    const meetCurrentBlocks=computed(()=>meetCurrentSession.value?meetCurrentSession.value.blocks||[]:[]);
    function saveDoorMeetings(){localStorage.setItem('doorMeetings',JSON.stringify(doorMeetings.value))}
    function doorOpenChar(c){
      doorActiveChar.value=c;
      if(!doorMeetings.value[c.id])doorMeetings.value[c.id]=[];
      const sessions=doorMeetings.value[c.id];
      const last=sessions.length>0?sessions[sessions.length-1]:null;
      if(last&&!last.ended){meetCurrentSession.value=last;meetConfig.value={context:last.config?.context||'',location:last.config?.location||'',time:last.config?.time||'',vibe:last.config?.vibe||''}}
      else{meetCurrentSession.value=null;meetConfig.value={context:'',location:'',time:'',vibe:''};if(!last)setTimeout(()=>{meetShowSettings.value=true},300)}
      pg.value='meet';nextTick(()=>{if(meetAnchor.value)meetAnchor.value.scrollIntoView()});
    }
    function meetStartNew(){
      if(!doorActiveChar.value)return;
      const cid=doorActiveChar.value.id;
      if(!doorMeetings.value[cid])doorMeetings.value[cid]=[];
      const sessions=doorMeetings.value[cid];
      if(sessions.length>0&&!sessions[sessions.length-1].ended){sessions[sessions.length-1].ended=true;sessions[sessions.length-1].endTime=Date.now()}
      const now=new Date();
      const label=`${now.getMonth()+1}月${now.getDate()}日 ${meetConfig.value.time||''} ${meetConfig.value.location||'某处'}`.trim();
      const newSess={id:'ms'+Date.now(),charId:cid,startTime:Date.now(),ended:false,config:{...meetConfig.value},label,blocks:[{id:'sep'+Date.now(),type:'sep',text:label}]};
      doorMeetings.value[cid].push(newSess);meetCurrentSession.value=newSess;saveDoorMeetings();meetShowSettings.value=false;
      nextTick(()=>{if(meetAnchor.value)meetAnchor.value.scrollIntoView()});meetGenerate();
    }
    function meetOnInput(){meetHasInput.value=meetInputEl.value&&meetInputEl.value.innerText.trim().length>0}
    async function meetSend(){
      const el=meetInputEl.value;const txt=el?el.innerText.trim():'';if(!txt||meetTyping.value)return;
      if(el){el.innerText='';meetHasInput.value=false}
      if(!meetCurrentSession.value){meetStartNew();await nextTick()}
      meetCurrentSession.value.blocks.push({id:'b'+Date.now(),type:'msg',role:'user',content:txt,ts:Date.now()});
      saveDoorMeetings();await nextTick(()=>{if(meetAnchor.value)meetAnchor.value.scrollIntoView({behavior:'smooth'})});
      await meetAiNarrate(txt,'user');
    }
    async function meetGenerate(){if(meetTyping.value)return;if(!meetCurrentSession.value){meetStartNew();return}await meetAiNarrate(null,'generate')}
    async function meetAiNarrate(userAction,mode){
      if(!doorActiveChar.value||!api.value.url||!api.value.key){alert('请先配置API');return}
      meetTyping.value=true;await nextTick(()=>{if(meetAnchor.value)meetAnchor.value.scrollIntoView({behavior:'smooth'})});
      try{
        const c=doorActiveChar.value;const cfg=meetCurrentSession.value.config||{};
        const mem=memoryLib.value[c.id];const memStr=mem&&mem.length>0?mem.map(t=>t.label+'：'+t.items.map(i=>i.text).join('、')).join('\n'):'无';
        const recentBlocks=meetCurrentSession.value.blocks.filter(b=>b.type==='msg').slice(-8).map(b=>`${b.role==='user'?(userProfile.value.name||'用户'):c.name}：${b.content}`).join('\n');
        const sys=`${c.system||'你是'+c.name+'。'}你现在和用户进行虚拟线下见面。地点：${cfg.location||'未指定'}，时间：${cfg.time||'未指定'}，前情：${cfg.context||'无'}，氛围：${cfg.vibe||'日常'}。记忆库：${memStr}。用第三人称小说笔法200-350字描写场景，包含环境细节、动作神态、对话、内心感受，保持角色性格。只输出叙事文字。`;
        const userContent=mode==='generate'?(recentBlocks?`继续叙写：\n${recentBlocks}`:'请生成见面开场叙事。'):`用户：「${userAction}」\n当前：\n${recentBlocks}\n请接续场景。`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:userContent}],stream:false,max_tokens:600})});
        const data=await res.json();if(data.error)throw new Error(data.error.message);
        const text=(data.choices?.[0]?.message?.content||'').trim();
        if(text){meetCurrentSession.value.blocks.push({id:'b'+Date.now(),type:'msg',role:'assistant',content:text,ts:Date.now()});saveDoorMeetings()}
      }catch(e){if(meetCurrentSession.value)meetCurrentSession.value.blocks.push({id:'b'+Date.now(),type:'msg',role:'assistant',content:'⚠️ '+e.message,ts:Date.now()});saveDoorMeetings()}
      finally{meetTyping.value=false;await nextTick(()=>{if(meetAnchor.value)meetAnchor.value.scrollIntoView({behavior:'smooth'})})}
    }
    async function meetEndMeeting(){
      if(!meetCurrentSession.value||!doorActiveChar.value)return;
      meetShowSettings.value=false;meetTyping.value=true;
      try{
        const c=doorActiveChar.value;const blocks=meetCurrentSession.value.blocks.filter(b=>b.type==='msg');
        const summary=blocks.map(b=>`${b.role==='user'?(userProfile.value.name||'用户'):c.name}：${b.content.slice(0,80)}`).join('\n');
        if(api.value.url&&api.value.key&&summary){
          const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:'将线下见面压缩为记忆要点，只输出JSON：{"label":"见面记忆","items":["要点1","要点2","要点3"]}，只输出JSON'},{role:'user',content:`见面内容：\n${summary}`}],stream:false,max_tokens:300})});
          const data=await res.json();
          try{const parsed=JSON.parse((data.choices?.[0]?.message?.content||'').replace(/```json|```/g,'').trim());if(!memoryLib.value[c.id])memoryLib.value[c.id]=[];memoryLib.value[c.id].push({label:'见面记忆·'+meetCurrentSession.value.label,items:(parsed.items||[]).map(t=>({text:t}))});saveMemoryLib()}catch(e2){}
        }
        meetCurrentSession.value.ended=true;meetCurrentSession.value.endTime=Date.now();saveDoorMeetings();
        if(!allMsgs.value[c.id])allMsgs.value[c.id]=[];allMsgs.value[c.id].push({role:'assistant',content:'[线下见面已结束·记忆已同步]',time:T.value,ts:Date.now()});saveMsgs();
        alert('见面记忆已保存！');meetCurrentSession.value=null;pg.value='door';
      }catch(e){alert('保存失败：'+e.message)}finally{meetTyping.value=false}
    }
    function meetStartLongpress(item,idx){if(item.type==='sep')return;meetLongpressTimer=setTimeout(()=>{meetLongpressBlock.value=idx;meetEditText.value=item.content},600)}
    function meetCancelLongpress(){clearTimeout(meetLongpressTimer)}
    function meetSaveEdit(){if(meetLongpressBlock.value===null||!meetCurrentSession.value)return;const blocks=meetCurrentSession.value.blocks;if(blocks[meetLongpressBlock.value]){blocks[meetLongpressBlock.value].content=meetEditText.value;saveDoorMeetings()}meetLongpressBlock.value=null}
    function meetDeleteBlock(){if(meetLongpressBlock.value===null||!meetCurrentSession.value)return;meetCurrentSession.value.blocks.splice(meetLongpressBlock.value,1);saveDoorMeetings();meetLongpressBlock.value=null}

    // ════ 入侵功能 ════
    const invPasswords=ref(JSON.parse(localStorage.getItem('invPasswords')||'{}'));
    const invTarget=ref(null);
    const invPhase=ref('idle');
    const invPwdInput=ref('');
    const invPwdErr=ref('');
    const invPwdMaxLen=ref(6);
    const invProgress=ref(0);
    const invConnLog=ref('');

    function invNumPress(key){
      if(key==='del'){invPwdInput.value=invPwdInput.value.slice(0,-1);return}
      const correct=invPasswords.value[invTarget.value?.id]?.pwd||'';
      const maxLen=Math.max(correct.length,6);
      invPwdMaxLen.value=maxLen;
      if(invPwdInput.value.length<maxLen)invPwdInput.value+=key;
    }
    const invOpenedApp=ref(null);
    const invAppData=ref({});
    const invAppLoading=ref(false);
    const INV_APP_TITLES={chat:'消息',wallet:'钱包',search:'搜索记录',music:'音乐',memo:'备忘录',photo:'相册',call:'通话记录',shop:'购物'};
    const invAppTitle=computed(()=>INV_APP_TITLES[invOpenedApp.value]||'');
    function invSavePwd(){localStorage.setItem('invPasswords',JSON.stringify(invPasswords.value))}
    async function invStart(c){
      invTarget.value=c;invPwdInput.value='';invPwdErr.value='';
      if(!invPasswords.value[c.id]){
        invPhase.value='genPwd';invProgress.value=0;invConnLog.value='SCANNING PROFILE DATA...';
        const timer=setInterval(()=>{invProgress.value=Math.min(invProgress.value+8,95)},120);
        try{
          if(!api.value.url||!api.value.key)throw new Error('no api');
          const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:'根据角色生成6-12位密码（与角色有关），给一句隐晦提示。只输出JSON：{"password":"密码","hint":"提示"}'},{role:'user',content:`角色：${c.name}\n设定：${(c.system||'').slice(0,100)}`}],stream:false,max_tokens:100})});
          const data=await res.json();const obj=JSON.parse((data.choices?.[0]?.message?.content||'{}').replace(/```json|```/g,'').trim());
          invPasswords.value[c.id]={pwd:obj.password||c.name,hint:obj.hint||'与角色相关'};invSavePwd();
        }catch(e){invPasswords.value[c.id]={pwd:'666666',hint:'与角色相关'};invSavePwd()}
        clearInterval(timer);invProgress.value=100;await new Promise(r=>setTimeout(r,400));invPhase.value='pwd';
      }else invPhase.value='pwd';
    }
    async function invTryPwd(){
      const input=invPwdInput.value.trim();const correct=invPasswords.value[invTarget.value?.id]?.pwd;
      if(input===correct||input==='666666'){
        invPwdErr.value='';invPhase.value='connecting';invProgress.value=0;
        const logs=['INITIALIZING...','BYPASSING FIREWALL...','DECRYPTING STREAM...','ACCESSING FILE SYSTEM...','LOADING DATA...','CONNECTED'];
        let li=0;const timer=setInterval(()=>{invProgress.value=Math.min(invProgress.value+6,99);invConnLog.value=logs[Math.min(li++,logs.length-1)]},220);
        await new Promise(r=>setTimeout(r,2800));clearInterval(timer);invProgress.value=100;
        if(Math.random()<0.2){
          invPhase.value='detected';
          const c=invTarget.value;
          if(c&&api.value.url&&api.value.key){
            const cid=c.id;if(!allMsgs.value[cid])allMsgs.value[cid]=[];
            const now=new Date();const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:(c.system||'你是'+c.name+'。')+'用户试图入侵你手机，你察觉了，发一条消息表示怀疑，15-30字，符合角色性格，只输出消息内容。'},{role:'user',content:'生成消息'}],stream:false,max_tokens:80})}).then(r=>r.json()).then(data=>{const reply=(data.choices?.[0]?.message?.content||'').trim();if(reply){allMsgs.value[cid].push({role:'assistant',content:reply,time:t,ts:Date.now()});c.unread=(c.unread||0)+1;saveChars();saveMsgs()}}).catch(()=>{});
          }
        }else{await new Promise(r=>setTimeout(r,300));invPhase.value='phone';invLoadAllData()}
      }else{invPwdErr.value='密码错误，请重试';setTimeout(()=>{invPwdErr.value=''},2000)}
    }
    const invPhoneLoading=ref(false);
    const invPhotoDetail=ref(null);
    const invPhotoPassword=ref('');
    const invPhotoUnlocked=ref(false);
    const invPhotoErr=ref('');
    const invChatDetail=ref(null);
    const invChatLoading=ref(false);
    const invMemoDetail=ref(null);

    function invOpenPhoto(item){
      invPhotoDetail.value=item;
      invPhotoPassword.value='';
      invPhotoUnlocked.value=false;
      invPhotoErr.value='';
    }
    function invUnlockPhoto(){
      const pwd=invPasswords.value[invTarget.value?.id]?.pwd;
      if(invPhotoPassword.value===pwd||invPhotoPassword.value==='666666'){
        invPhotoUnlocked.value=true;invPhotoErr.value='';
      }else{invPhotoErr.value='密码错误'}
    }
      function invOpenChat(item){
      const c=invTarget.value;
      const uName=(userProfile.value?.name||'用户');
      if(item.isUserChat||item.name===uName){
        const realMsgs=(allMsgs.value[c?.id]||[]).map(m=>({
          isMe:m.role==='assistant',
          content:m.role==='assistant'?(m.bubbles?m.bubbles.join(' '):m.content):m.content
        }));
        invChatDetail.value={...item,name:uName,messages:realMsgs};
        return;
      }
      invChatDetail.value={...item,messages:item.messages||[]};
    }
        function invOpenGroupChat(g){
      // 显示群聊消息记录
      const msgs=(gcAllMsgs.value[g.id]||[]).map(m=>{
        if(m.charId==='user') return{isMe:false,content:(userProfile.value?.name||'用户')+'：'+m.content};
        const ch=chars.value.find(c=>c.id===m.charId);
        return{isMe:m.charId===invTarget.value?.id,content:(ch?ch.name:'?')+'：'+m.content};
      });
      invChatDetail.value={name:g.name,emoji:g.emoji||'👥',messages:msgs,isGroup:true};
    }
    const invMemoPassword=ref('');
    const invMemoErr=ref('');

    function invToggleMemo(item){
      item._open=!item._open;
      // 强制触发Vue响应式（防止_open是新属性未被追踪）
      const idx=(invAppData.value.memos||[]).indexOf(item);
      if(idx>=0)invAppData.value.memos[idx]=Object.assign({},item);
    }
    function invUnlockMemoItem(item){
      const pwd=invPasswords.value[invTarget.value?.id]?.pwd;
      if(invMemoPassword.value===pwd||invMemoPassword.value==='666666'){
        item.locked=false;invMemoErr.value='';invMemoPassword.value='';
      }else{invMemoErr.value='密码错误';setTimeout(()=>{invMemoErr.value=''},2000)}
    }
    function invCalcBalance(wallet){
      if(!wallet||wallet.length===0)return'--';
      let total=Math.floor(Math.random()*20000+5000);
      return total.toLocaleString()+'.'+String(Math.floor(Math.random()*100)).padStart(2,'0');
    }

    async function invLoadAllData(){
      const c=invTarget.value;if(!c)return;
      const cacheKey='invAllData_'+c.id;
      const cached=localStorage.getItem(cacheKey);
      if(cached){invAppData.value=JSON.parse(cached);return}
      if(!api.value.url||!api.value.key)return;
      invPhoneLoading.value=true;
      try{
        // 注入记忆
        const mem=memoryLib.value[c.id];
        const memStr=mem&&mem.length>0?mem.map(t=>t.label+'：'+t.items.map(i=>i.text).join('、')).join('\n'):'无';
        // 注入今日行程
        const dateKey=new Date().toISOString().slice(0,10);
        const sch=calSchedules.value[c.id]?.[dateKey];
        const schStr=sch?.items?sch.items.map(s=>s.time+' '+s.title).join('，'):'无';
        // 注入最近聊天记录（参考文件逻辑）
        const recentMsgs=(allMsgs.value[c.id]||[]).slice(-15);
        const chatStr=recentMsgs.map(m=>m.role==='user'?(userProfile.value?.name||'用户')+': '+m.content:c.name+': '+(m.bubbles?m.bubbles.join(' '):m.content)).join('\n');
        // 构建联系人列表（排除自己，用于生成chats）
        const otherChars=chars.value.filter(ch=>ch.id!==c.id).map(ch=>`${ch.name}（关系：${ch.relation||ch.identity||'朋友'}）`).join('、');
        const userRelation=(c.relation||c.identity||'');
        const userName=(userProfile.value?.name||'用户');
        const userInfo=(userProfile.value?.system||userProfile.value?.bio||'');
        const sys=`【角色设定】
你是${c.name}。
性格与背景：${c.system||''}
与用户的关系：${userRelation}
用户名：${userName}（禁止写{{user}}，直接写"${userName}"）
用户背景：${userInfo||'无'}

【记忆】${memStr}
【今日行程】${schStr}
【角色与用户最近15条真实聊天记录（chats里与用户的对话必须基于此续写）】
${chatStr||'无'}
【手机里认识的人（排除群聊）】${otherChars||'无'}

【任务】以${c.name}的视角，生成手机里所有App的真实数据。

【格式规则——强制执行】
- 禁止输出任何独立的英文内容，所有英文单词、短语、句子后面必须立即跟括号中文翻译
- 格式：English content (中文翻译)，括号紧跟英文，不得省略
- 例：Rifle Zero Data (步枪归零数据)、For cold weather operations (用于寒冷天气作战)
- 纯中文内容不需要括号
- 违反此规则视为输出失败


【绝对禁止】
1. 禁止OOC：发言必须100%符合${c.name}的性格设定
2. 禁止关系错位：队友聊任务工作，朋友聊日常，恋人才亲密
3. 禁止{{user}}模板变量，直接写"${userName}"
4. chats里必须有一条与"${userName}"的对话，内容基于真实聊天记录续写
5. chats不包含群聊，只有私信联系人
6. memos第3条必须是${c.name}关于${userName}的私密心理（locked:true）

只输出JSON：
{"chats":[{"name":"联系人名","emoji":"表情","relation":"关系","lastMsg":"内容 (中文翻译)","time":"时间","messages":[{"isMe":true或false,"content":"内容 (中文翻译)"}]}],"wallet":{"balance":"余额","transactions":[{"title":"项目 (中文)","note":"备注 (中文)","amount":"金额","type":"in或out","time":"时间"}]},"searches":[{"keyword":"搜索词 (中文翻译)","time":"时间"}],"songs":[{"name":"歌名 (中文)","artist":"歌手","count":次数}],"memos":[{"title":"标题 (中文翻译)","content":"内容 (中文翻译)，200字内","locked":false}],"photos":[{"title":"主题 (中文)","detail":"描述 (中文翻译)，50字","locked":false}],"calls":[{"name":"联系人","note":"简述 (中文翻译)","type":"missed或answered或rejected","time":"时间"}],"bought":[{"name":"商品名 (中文)","note":"备注 (中文)","amount":"价格","time":"时间"}],"cart":[{"name":"商品名 (中文)","note":"备注 (中文)","amount":"价格"}]}
chats 4条私信(含${userName}的对话，messages基于真实记录续写4-6条)，wallet.transactions 4条，searches 5条，songs 4条，memos 3条(第3条locked)，photos 4张(1张locked)，calls 4条，bought 3件，cart 2件。只输出JSON。`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'user',content:sys}],stream:false,max_tokens:4000})});
        const data=await res.json();if(data.error)throw new Error(data.error.message);
        const parsed=JSON.parse((data.choices?.[0]?.message?.content||'{}').replace(/```json|```/g,'').trim());
        invAppData.value=parsed;localStorage.setItem(cacheKey,JSON.stringify(parsed));
      }catch(e){console.error(e)}
      finally{invPhoneLoading.value=false}
    }
    function invUnlockMemo(item){const input=prompt('输入密码解锁');const pwd=invPasswords.value[invTarget.value?.id]?.pwd;if(input===pwd||input==='666666')item.locked=false;else alert('密码错误')}
    function invExit(){invPhase.value='idle';invTarget.value=null;invOpenedApp.value=null;invAppData.value={}}


    // ════ 盲盒功能 ════
    const BB_RARITIES=['N','N','N','R','R','SR','SSR'];
    const BB_ITEMS=[
      {icon:'🧸',name:'泰迪熊',desc:'一只憨厚的棕色泰迪熊，眼睛闪亮，触感柔软。'},{icon:'🌹',name:'永生玫瑰',desc:'用特殊工艺保存的玫瑰，永不凋谢，象征不变的心意。'},
      {icon:'📷',name:'拍立得相机',desc:'复古风格的拍立得，能捕捉最珍贵的瞬间。'},{icon:'🍫',name:'比利时手工巧克力',desc:'精选可可制成，入口即化，带着微苦的甜蜜。'},
      {icon:'🕯️',name:'香薰蜡烛',desc:'淡淡的琥珀与雪松香气，点燃后让人无比平静。'},{icon:'📚',name:'精装诗集',desc:'烫金封面，收录了最动人的情诗，扉页可以题字。'},
      {icon:'🎵',name:'黑胶唱片',desc:'限量复刻版，收录了十首经典老歌，值得珍藏。'},{icon:'🌙',name:'星图项链',desc:'刻有特定日期夜空星图的925银项链，独一无二。'},
      {icon:'☕',name:'手冲咖啡礼盒',desc:'精选三种产区单品咖啡豆，附手冲壶和滤纸。'},{icon:'🎨',name:'水彩画套装',desc:'专业级别的48色水彩，画出心中的色彩。'},
      {icon:'🦋',name:'蝴蝶标本',desc:'保存完好的蓝闪蝶，在光线下会折射出神秘光泽。'},{icon:'🔮',name:'水晶球',desc:'内含微型雪景，轻轻摇晃，雪花漫天飞舞。'},
      {icon:'🗺️',name:'手绘城市地图',desc:'纯手工描绘，标注了城市里所有有故事的角落。'},{icon:'🎠',name:'音乐盒',desc:'打开后旋转的芭蕾舞女演奏一首古典小曲。'},
      {icon:'🌟',name:'陨石碎片',desc:'真实陨石，附证书，来自宇宙深处的问候。'},
    ];
    const bbShelfItems=ref(JSON.parse(localStorage.getItem('bbShelf')||'[]'));
    const bbUsedDate=ref(localStorage.getItem('bbUsedDate')||'');
    const bbTodayItem=ref(JSON.parse(localStorage.getItem('bbTodayItem')||'null'));
    const bbUsedToday=computed(()=>bbUsedDate.value===new Date().toISOString().slice(0,10));
    const bbNextResetTimer=ref('');
    const bbOpenAnim=ref(false);
    const bbDialogActive=ref(false);
    const bbDialogChar=ref(null);
    const bbDialogStep=ref(0);
    const bbDialogHistory=ref([]);
    const bbDialogTyping=ref(false);
    const bbChoices=ref([]);
    const bbDialogMsgs=ref(null);
    const bbDialogAnchor=ref(null);
    const bbFanficActive=ref(false);
    const bbFanficText=ref('');
    const bbFanficGenerating=ref(false);
    const bbFanficProgress=ref(0);
    const bbShowShelf=ref(false);
    const bbShelfDetailItem=ref(null);

    function bbSaveShelf(){localStorage.setItem('bbShelf',JSON.stringify(bbShelfItems.value))}
    function bbUpdateTimer(){
      const now=new Date();const midnight=new Date(now);midnight.setHours(24,0,0,0);
      const diff=midnight-now;const h=Math.floor(diff/3600000);const m=Math.floor((diff%3600000)/60000);const s=Math.floor((diff%60000)/1000);
      bbNextResetTimer.value=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    setInterval(bbUpdateTimer,1000);bbUpdateTimer();

    function bbDraw(){
      if(bbUsedToday.value)return;
      const rarity=BB_RARITIES[Math.floor(Math.random()*BB_RARITIES.length)];
      const item={...BB_ITEMS[Math.floor(Math.random()*BB_ITEMS.length)],rarity,date:new Date().toISOString().slice(0,10)};
      bbTodayItem.value=item;bbOpenAnim.value=true;
      bbUsedDate.value=new Date().toISOString().slice(0,10);
      localStorage.setItem('bbUsedDate',bbUsedDate.value);
      localStorage.setItem('bbTodayItem',JSON.stringify(item));
    }

    async function bbStartDialog(){
      bbOpenAnim.value=false;
      if(chars.value.length===0){alert('请先添加角色');return}
      bbDialogChar.value=chars.value[0];
      bbDialogStep.value=0;bbDialogHistory.value=[];bbChoices.value=[];
      bbDialogActive.value=true;
      await bbNextDialogStep();
    }

    async function bbNextDialogStep(){
      if(!api.value.url||!api.value.key){alert('请先配置API');return}
      bbDialogStep.value++;
      if(bbDialogStep.value>5){
        // 对话结束，生成同人文
        bbDialogActive.value=false;bbFanficActive.value=true;
        await bbGenerateFanfic();return;
      }
      bbDialogTyping.value=true;
      await nextTick(()=>{if(bbDialogAnchor.value)bbDialogAnchor.value.scrollIntoView({behavior:'smooth'})});
      try{
        const c=bbDialogChar.value;const item=bbTodayItem.value;
        const history=bbDialogHistory.value.map(m=>({role:m.role==='user'?'user':'assistant',content:m.content}));
        const sys=`${c.system||'你是'+c.name+'。'}
用户要把一个「${item.name}」(${item.rarity}稀有度)送给你。这是第${bbDialogStep.value}/5轮对话。
对话目标：自然地表达对礼物的反应，问用户相关的问题，推进感情。
${bbDialogStep.value===1?'第一轮：对用户送礼物表达惊喜/感动/好奇，问"你要把这个送给谁？"这样的开场。':''}
${bbDialogStep.value===5?'第五轮：收束对话，表达深情，暗示这份礼物的意义。':''}
只输出你这轮的发言（30-60字），符合角色性格，不要OOC，不要旁白。`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},...history,{role:'user',content:bbDialogStep.value===1?`我有一个「${item.name}」想送给你`:'继续对话'}],stream:false,max_tokens:150})});
        const data=await res.json();const reply=(data.choices?.[0]?.message?.content||'').trim();
        bbDialogHistory.value.push({role:'assistant',content:reply});
        // 生成三个选项
        const choicesRes=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:'根据对话，给用户生成3个回应选项，风格多样（温柔/调皮/认真），每个15-25字。只输出JSON数组：["选项1","选项2","选项3"]'},{role:'user',content:`角色说：${reply}`}],stream:false,max_tokens:150})});
        const choicesData=await choicesRes.json();
        try{bbChoices.value=JSON.parse((choicesData.choices?.[0]?.message?.content||'[]').replace(/```json|```/g,'').trim())}
        catch(e){bbChoices.value=['好的','嗯嗯','谢谢你']}
      }catch(e){bbDialogHistory.value.push({role:'assistant',content:'⚠️ '+e.message})}
      finally{bbDialogTyping.value=false;await nextTick(()=>{if(bbDialogAnchor.value)bbDialogAnchor.value.scrollIntoView({behavior:'smooth'})})}
    }

    async function bbPickChoice(choice){
      bbChoices.value=[];bbDialogHistory.value.push({role:'user',content:choice});
      await nextTick(()=>{if(bbDialogAnchor.value)bbDialogAnchor.value.scrollIntoView({behavior:'smooth'})});
      await bbNextDialogStep();
    }

    async function bbGenerateFanfic(){
      if(!api.value.url||!api.value.key){bbFanficText.value='请先配置API';return}
      bbFanficGenerating.value=true;bbFanficProgress.value=0;bbFanficText.value='';
      const progressTimer=setInterval(()=>{bbFanficProgress.value=Math.min(bbFanficProgress.value+2,95)},200);
      try{
        const c=bbDialogChar.value;const item=bbTodayItem.value;
        const dialogSummary=bbDialogHistory.value.map(m=>`${m.role==='user'?(userProfile.value.name||'用户'):c.name}：${m.content}`).join('\n');
        const mem=memoryLib.value[c.id];const memStr=mem&&mem.length>0?mem.slice(-3).map(t=>t.label+'：'+t.items.map(i=>i.text).join('、')).join('\n'):'无';
        const sys=`${c.system||'你是'+c.name+'。'}你擅长写细腻的同人文。根据以下信息写一篇角色×用户的同人小说，要求：
1. 约2000字，第三人称，小说叙述风格
2. 以「${item.name}」这个礼物为核心道具
3. 融入刚才的对话内容和情感
4. 描写细腻，有环境描写，有心理活动，有对话
5. 符合角色性格，不要OOC
6. 结局温馨或留有余韵

礼物：${item.name}（${item.rarity}）- ${item.desc}
记忆库：${memStr}
赠礼对话：\n${dialogSummary}`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:'请开始写作'}],stream:false,max_tokens:2500})});
        const data=await res.json();bbFanficText.value=(data.choices?.[0]?.message?.content||'生成失败').trim();
        // 保存到展品架
        const shelfItem={...item,charName:c.name,fanfic:bbFanficText.value,dialogHistory:[...bbDialogHistory.value]};
        bbShelfItems.value.unshift(shelfItem);bbSaveShelf();
        // 保存记忆
        if(!memoryLib.value[c.id])memoryLib.value[c.id]=[];
        memoryLib.value[c.id].push({label:'盲盒赠礼',items:[{text:`用户送了「${item.name}」（${item.rarity}），两人有一段温馨互动`}]});saveMemoryLib();
      }catch(e){bbFanficText.value='生成失败：'+e.message}
      finally{clearInterval(progressTimer);bbFanficProgress.value=100;bbFanficGenerating.value=false}
    }

    function bbViewShelfItem(item){bbShelfDetailItem.value=item}

    // ════ 论坛功能 ════
    const FORUM_TAG_COLORS={'综合讨论':'#5a7a4a','闲聊水贴':'#7a6b8a','情感树洞':'#c07050','情报分享':'#4a7a8a','八卦吃瓜':'#c05070'};
    const forumTabs=ref([{id:'all',name:'全部'},{id:'综合讨论',name:'综合讨论'},{id:'闲聊水贴',name:'闲聊水贴'},{id:'情感树洞',name:'情感树洞'},{id:'情报分享',name:'情报分享'},{id:'八卦吃瓜',name:'八卦吃瓜'}]);
    const forumTab=ref('all');
    const forumBottomTab=ref('home');
    const forumSearchKw=ref('');
    const forumPosts=ref(JSON.parse(localStorage.getItem('forumPosts')||'[]'));
    const forumName=ref(localStorage.getItem('forumName')||'综合论坛');
    const forumSlogan=ref(localStorage.getItem('forumSlogan')||'');
    const forumGenerating=ref(false);
    const forumDetailPost=ref(null);
    const forumReplyTyping=ref(false);
    const forumReplyHasInput=ref(false);
    const forumReplyInputEl=ref(null);
    const forumDetailBody=ref(null);
    const forumReplyAnchor=ref(null);
    const forumShowPost=ref(false);
    const forumPreviewImg=ref(null);
    const forumRealPreview=ref(null);
    const forumPendingImg=ref(null);
    const forumNewPost=ref({tag:'综合讨论',title:'',content:'',anon:false,anonName:'',imgData:null});

    const forumFilteredPosts=computed(()=>{
      let posts=[...forumPosts.value];
      if(forumTab.value!=='all')posts=posts.filter(p=>p.tag===forumTab.value);
      if(forumSearchKw.value.trim()){
        const kw=forumSearchKw.value.trim().toLowerCase();
        posts=posts.filter(p=>p.title.toLowerCase().includes(kw)||p.author.toLowerCase().includes(kw)||(p.preview||'').toLowerCase().includes(kw));
        posts=posts.map(p=>{
          const idx=p.title.toLowerCase().indexOf(kw);
          if(idx>=0){return{...p,highlight:null}}
          const pidx=(p.preview||'').toLowerCase().indexOf(kw);
          if(pidx>=0){const pre=p.preview;return{...p,highlight:pre.slice(0,pidx)+'<b>'+pre.slice(pidx,pidx+kw.length)+'</b>'+pre.slice(pidx+kw.length)}}
          return p;
        });
      }
      return[...posts.filter(p=>p.pinned),...posts.filter(p=>!p.pinned)];
    });

    function forumTagColor(tag){return FORUM_TAG_COLORS[tag]||'#888'}
    function forumDoSearch(){}
    function forumToggleLike(post){if(post.userLiked)return;post.userLiked=true;post.likes=(post.likes||0)+1;forumSavePosts()}
    function forumSavePosts(){localStorage.setItem('forumPosts',JSON.stringify(forumPosts.value))}

    const FORUM_NPC_NAMES=['路人甲','随风而去','不知名的人','深夜的猫','午后阳光','幻影旅人','城市行者','匿名观察者','时光旅行者','午夜来信','旁观者清','风中有朵雨做的云','键盘侠本侠','社会人007','打工人小李','摸鱼达人','吃瓜群众','真相探寻者','论坛老鬼','小透明一枚'];
    const FORUM_EMOJIS=['😊','😤','🤔','😂','🥺','😏','🙄','😮','🤦','🤷','👀','💀','🫠','😭','🤌'];

    async function forumRefresh(){
      if(forumGenerating.value)return;
      if(!api.value.url||!api.value.key){alert('请先设置API');return}
      forumGenerating.value=true;
      try{
        const c=chars.value[0];
        const charInfo=chars.value.map(ch=>`${ch.name}（${ch.identity||ch.relation||'角色'}）`).join('、');
        // 生成论坛名字（只在第一次）
        if(forumPosts.value.length===0){
          const nameRes=await forumCallAI(`根据以下角色世界观，为一个虚拟论坛起一个有特色的中文名字和一句slogan。
角色：${charInfo}
世界书摘要：${wbBooks.value.map(b=>b.name).join('、')||'无'}
只输出JSON：{"name":"论坛名","slogan":"一句话简介"}`,'只输出JSON，不要其他内容',80);
          try{const r=JSON.parse(nameRes.replace(/```json|```/g,'').trim());forumName.value=r.name||'综合论坛';forumSlogan.value=r.slogan||'';localStorage.setItem('forumName',forumName.value);localStorage.setItem('forumSlogan',forumSlogan.value)}catch(e){}
        }
        const tags=['综合讨论','闲聊水贴','情感树洞','情报分享','八卦吃瓜'];
        const sys=`你是一个虚拟论坛的内容生成器。根据给定角色和世界观，生成8-10条论坛帖子。
角色：${charInfo}
帖子要：真实感强，话题多样，接地气，偶尔和角色相关但不必每条都是。
发帖人一定不能是角色名（${chars.value.map(c=>c.name).join('、')}），用网名/路人ID/NPC名字。
只输出JSON数组，每条格式：{"tag":"版块名","title":"标题","content":"正文100-200字","preview":"摘要30字","author":"发帖人ID","authorEmoji":"表情","fakeImg":{"title":"图片标题","detail":"图片内容描述50字"}或null,"replyCount":数字,"viewCount":数字,"time":"今天 HH:MM"}
版块只能是：综合讨论/闲聊水贴/情感树洞/情报分享/八卦吃瓜
只输出JSON数组，不要其他内容。`;
        const raw=await forumCallAI('生成帖子内容',sys,2000);
        const arr=JSON.parse(raw.replace(/```json|```/g,'').trim());
        const newPosts=arr.map((p,i)=>({
          id:'fp'+Date.now()+i,tag:tags.includes(p.tag)?p.tag:'综合讨论',
          title:p.title||'无标题',content:p.content||'',preview:p.preview||'',
          author:p.author||FORUM_NPC_NAMES[i%FORUM_NPC_NAMES.length],
          authorEmoji:p.authorEmoji||FORUM_EMOJIS[i%FORUM_EMOJIS.length],
          fakeImg:p.fakeImg||null,realImg:null,
          replyCount:p.replyCount||0,viewCount:p.viewCount||0,
          time:p.time||T.value,likes:0,userLiked:false,pinned:false,
          replies:[],authorIsUser:false
        }));
        forumPosts.value=[...newPosts,...forumPosts.value].slice(0,60);
        forumSavePosts();
      }catch(e){alert('生成失败：'+e.message)}
      finally{forumGenerating.value=false}
    }

    async function forumCallAI(userMsg,sys,maxTok=500){
      const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},
        body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:userMsg}],stream:false,max_tokens:maxTok})
      });
      const data=await res.json();
      if(data.error)throw new Error(data.error.message);
      return data.choices?.[0]?.message?.content||'';
    }

    function forumOpenPost(post){
      post.viewCount=(post.viewCount||0)+1;
      forumDetailPost.value=post;
      forumSavePosts();
      nextTick(()=>{if(forumReplyAnchor.value)forumReplyAnchor.value.scrollIntoView()});
      console.log('forumOpenPost: replies=',post.replies?.length,'api=',!!api.value.url,!!api.value.key);
      if(!post.replies||post.replies.length===0){
        console.log('forumOpenPost: 触发生成回复');
        setTimeout(()=>forumGenAllReplies(post),500);
      }
    }

    async function forumGenAllReplies(post){
      if(!api.value.url||!api.value.key){console.warn('forumGenAllReplies: 无API配置');return;}
      forumReplyTyping.value=true;
      try{
        // 构建回复者列表（部分NPC + 可能有角色）
        // 真实感网名生成
        const adjPool=['沉默的','低调的','随便看看的','路过的','不说话的','只看不说的','有点懂的','深夜刷帖的','想退圈的','越来越懒的','半个圈内人','啥也不是的'];
        const nounPool=['老六','老登','朋友','网友','吃瓜人','局外人','好奇宝宝','小透明','过客','观察者','打工人','普通人'];
        const realNamePool=['叫我小陈就好','不想起名字','就是随便看看','名字想了三天','忘了改备注','这个ID已被占用','明天再想名字','懒得取名','用户已注销','已经不重要了','匿名用户甲','沿途的风景x','深夜睡不着觉','有人在吗','信号不好别找我'];
        function makeNpcId(){
          const r=Math.random();
          if(r<0.4)return realNamePool[Math.floor(Math.random()*realNamePool.length)];
          if(r<0.7)return adjPool[Math.floor(Math.random()*adjPool.length)]+nounPool[Math.floor(Math.random()*nounPool.length)];
          return adjPool[Math.floor(Math.random()*adjPool.length)]+nounPool[Math.floor(Math.random()*nounPool.length)]+(Math.random()<0.5?Math.floor(Math.random()*99+1):'');
        }
        const names=[];
        // 角色参与（70%概率），用随机网名不暴露真名
        if(chars.value.length>0&&Math.random()>0.3){
          const c=chars.value[Math.floor(Math.random()*chars.value.length)];
          const disguise=adjPool[Math.floor(Math.random()*adjPool.length)]+nounPool[Math.floor(Math.random()*nounPool.length)];
          names.push({id:disguise,isChar:true,charId:c.id,emoji:c.emoji||'🌿'});
        }
        while(names.length<5){
          names.push({id:makeNpcId(),isChar:false,charId:null,emoji:'👤'});
        }
        const prompt=`帖子：${post.title}\n内容：${post.content.slice(0,150)}\n\n为这个帖子生成${names.length}条网友回复，每条20-50字，口语化，有真实感。\n回复者：${names.map((n,i)=>i+1+'.'+n.id).join('、')}\n\n只输出JSON数组，格式：[{"author":"用户名","content":"回复内容"}]\n只输出JSON数组，不要其他任何内容。`;
        
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},
          body:JSON.stringify({model:api.value.model,messages:[{role:'user',content:prompt}],stream:false,max_tokens:1000})
        });
        const data=await res.json();
        console.log('forumGenAllReplies API返回:',data);
        if(data.error)throw new Error(data.error.message);
        const raw=data.choices?.[0]?.message?.content||'';
        console.log('forumGenAllReplies raw:',raw);
        
        let arr=[];
        try{
          const clean=raw.replace(/```json|```/g,'').trim();
          const match=clean.match(/\[[\s\S]*\]/);
          arr=JSON.parse(match?match[0]:clean);
          if(!Array.isArray(arr))arr=[];
        }catch(e){console.warn('JSON解析失败:',e,'raw:',raw);}
        
        console.log('forumGenAllReplies 解析到回复数:',arr.length);
        if(arr.length===0)return;
        
        const now=new Date();
        const t=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
        const newReplies=arr.map((item,i)=>{
          const spec=names[i]||names[names.length-1];
          return{author:item.author||spec.id,authorEmoji:spec.emoji,authorIsChar:spec.isChar,charId:spec.charId,content:(item.content||'').trim(),time:t,fakeImg:null,realImg:null};
        });
        
        // 强制Vue响应式更新
        const pidx=forumPosts.value.findIndex(p=>p.id===post.id);
        if(pidx>=0){
          const updated={...forumPosts.value[pidx],replies:newReplies,replyCount:newReplies.length};
          forumPosts.value[pidx]=updated;
          forumDetailPost.value=updated;
        }else{
          post.replies=newReplies;
          post.replyCount=newReplies.length;
          forumDetailPost.value={...post};
        }
        forumSavePosts();
        await nextTick(()=>{if(forumReplyAnchor.value)forumReplyAnchor.value.scrollIntoView({behavior:'smooth'})});
      }catch(e){console.error('forumGenAllReplies错误:',e);}
      finally{forumReplyTyping.value=false;}
    }

    // 保留旧函数名兼容旧调用
    async function forumCharAutoReply(post){await forumGenAllReplies(post)}

    function forumReplyOnInput(){forumReplyHasInput.value=forumReplyInputEl.value&&forumReplyInputEl.value.innerText.trim().length>0}

    async function forumSendReply(){
      const el=forumReplyInputEl.value;
      const txt=el?el.innerText.trim():'';
      if(!txt&&!forumPendingImg.value)return;
      if(el){el.innerText='';forumReplyHasInput.value=false}
      const post=forumDetailPost.value;if(!post)return;
      if(!post.replies)post.replies=[];
      const now=new Date();
      const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const myName=userProfile.value.name||'我';
      post.replies.push({
        author:myName,authorEmoji:'🧑',authorIsUser:true,
        content:txt,time:t,
        fakeImg:null,realImg:forumPendingImg.value||null
      });
      forumPendingImg.value=null;
      post.replyCount=post.replies.length;
      forumSavePosts();
      await nextTick(()=>{if(forumReplyAnchor.value)forumReplyAnchor.value.scrollIntoView({behavior:'smooth'})});
      // AI角色盖楼回复
      if(api.value.url&&api.value.key&&chars.value.length>0){
        forumReplyTyping.value=true;
        try{
          const c=chars.value[Math.floor(Math.random()*chars.value.length)];
          const sys=`${c.system||'你是'+c.name+'。'}
你在一个虚拟论坛上，用户刚回复了一个帖子，你也在这个帖子里，作为网友自然地回应用户的发言，20-50字，符合角色性格，像真实网友互动。
只输出回复内容。`;
          const context=`帖子：${post.title}\n用户发言：${txt||'[图片]'}`;
          let userContent=context;
          if(forumPendingImg.value&&api.value.model.includes('vision')){
            // 如果上传了图，带图分析
          }
          const reply=await forumCallAI(userContent,sys,120);
          post.replies.push({
            author:c.name,authorEmoji:c.emoji||'🌿',authorIsChar:true,
            content:reply.replace(/```|"/g,'').trim(),time:T.value,
            fakeImg:null,realImg:null
          });
          post.replyCount=post.replies.length;
          forumSavePosts();
          await nextTick(()=>{if(forumReplyAnchor.value)forumReplyAnchor.value.scrollIntoView({behavior:'smooth'})});
        }catch(e){console.error(e)}
        finally{forumReplyTyping.value=false}
      }
    }

    function forumPickImg(e){
      const f=e.target.files[0];if(!f)return;
      const r=new FileReader();
      r.onload=ev=>{forumPendingImg.value=ev.target.result};
      r.readAsDataURL(f);e.target.value='';
    }

    function forumPickPostImg(e){
      const f=e.target.files[0];if(!f)return;
      const r=new FileReader();
      r.onload=ev=>{forumNewPost.value.imgData=ev.target.result};
      r.readAsDataURL(f);e.target.value='';
    }

    async function forumSubmitPost(){
      if(!forumNewPost.value.title.trim()){alert('请填写标题');return}
      const now=new Date();
      const t=`今天 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const isAnon=forumNewPost.value.anon&&forumNewPost.value.anonName.trim();
      const authorName=isAnon?forumNewPost.value.anonName.trim():(userProfile.value.name||'我');
      const post={
        id:'fp'+Date.now(),
        tag:forumNewPost.value.tag||'综合讨论',
        title:forumNewPost.value.title.trim(),
        content:forumNewPost.value.content.trim(),
        preview:(forumNewPost.value.content.trim()).slice(0,40),
        author:authorName,
        authorEmoji:isAnon?'🎭':'🧑',
        authorIsUser:!isAnon,
        authorIsAnon:isAnon,
        anonRealName:isAnon?(userProfile.value.name||'我'):null,
        realImg:forumNewPost.value.imgData||null,
        fakeImg:null,
        replyCount:0,viewCount:0,time:t,likes:0,userLiked:false,pinned:false,replies:[]
      };
      forumPosts.value.unshift(post);
      forumSavePosts();
      forumShowPost.value=false;
      forumNewPost.value={tag:'综合讨论',title:'',content:'',anon:false,anonName:'',imgData:null};
      // 马甲30%概率被角色认出，注入记忆
      if(isAnon&&chars.value.length>0&&Math.random()<0.3){
        const c=chars.value[0];
        if(!memoryLib.value[c.id])memoryLib.value[c.id]=[];
        const hasTag=memoryLib.value[c.id].find(t=>t.label==='论坛观察');
        const item=`你在论坛上看到马甲「${post.author}」发帖《${post.title}》，你隐约觉得是${post.anonRealName||'用户'}`;
        if(hasTag){hasTag.items.push({text:item})}
        else{memoryLib.value[c.id].push({label:'论坛观察',items:[{text:item}]})}
        saveMemoryLib();
      }
      // 自动让角色回复
      setTimeout(()=>forumCharAutoReply(post),500);
      forumOpenPost(post);
    }


    // ════ 群聊功能 ════
    const groups=ref(JSON.parse(localStorage.getItem('groups')||'[]'));
    const gcActiveGroup=ref(null);
    const gcShowCreate=ref(false);
    const gcShowSettings=ref(false);
    const gcShowEmojiPanel=ref(false);
    const gcTyping=ref(false);
    const gcHasInput=ref(false);
    const gcInputEl=ref(null);
    const gcMsgBox=ref(null);
    const gcAnchor=ref(null);
    const gcActionMenu=ref(null);
    const gcShowTrans=ref(false);
    const gcNewName=ref('');
    const gcNewMembers=ref([]);
    const gcNewWithUser=ref(true);
    const gcAllMsgs=ref(JSON.parse(localStorage.getItem('gcMsgs')||'{}'));
    let gcLpTimer=null;
    function gcSaveGroups(){localStorage.setItem('groups',JSON.stringify(groups.value))}
    function gcSaveMsgs(){localStorage.setItem('gcMsgs',JSON.stringify(gcAllMsgs.value))}
    const gcCurMsgs=computed(()=>gcActiveGroup.value?gcAllMsgs.value[gcActiveGroup.value.id]||[]:[]);
    function gcGetChar(id){return chars.value.find(c=>c.id===id)||null}
    function gcAvatars(g){return g.memberIds.map(id=>{if(id==='user')return{emoji:'🧑',name:'我',avatarImg:userProfile.value.avatarImg};return gcGetChar(id)||{emoji:'🌿',name:'?'}}).slice(0,4)}
    function gcOpen(g){gcActiveGroup.value=g;nextTick(()=>{if(gcAnchor.value)gcAnchor.value.scrollIntoView()})}
    function gcToggleMember(id){const idx=gcNewMembers.value.indexOf(id);if(idx>=0)gcNewMembers.value.splice(idx,1);else gcNewMembers.value.push(id)}
    function gcCreate(){
      if(gcNewMembers.value.length===0){alert('至少选一个角色');return}
      const members=[...gcNewMembers.value];
      if(gcNewWithUser.value)members.unshift('user');
      const g={id:'gc'+Date.now(),name:gcNewName.value.trim()||members.map(id=>id==='user'?(userProfile.value.name||'我'):gcGetChar(id)?.name||'').join('、').slice(0,12),memberIds:members,avatarImg:'',lastMsg:'',lastTime:''};
      groups.value.unshift(g);gcSaveGroups();gcNewName.value='';gcNewMembers.value=[];gcNewWithUser.value=true;gcShowCreate.value=false;gcOpen(g);
    }
    function gcDisband(){if(!gcActiveGroup.value)return;if(!confirm('确定解散群聊？'))return;groups.value=groups.value.filter(g=>g.id!==gcActiveGroup.value.id);gcSaveGroups();gcActiveGroup.value=null;gcShowSettings.value=false}
    function gcUploadAvatar(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{gcActiveGroup.value.avatarImg=ev.target.result;gcSaveGroups()};r.readAsDataURL(f);e.target.value=''}
    function gcOnInput(){gcHasInput.value=gcInputEl.value&&gcInputEl.value.innerText.trim().length>0}
    function gcInsertEmoji(e){if(!gcInputEl.value)return;gcInputEl.value.focus();document.execCommand('insertText',false,e);gcHasInput.value=true;gcShowEmojiPanel.value=false}
    function gcScrollB(){if(gcAnchor.value)gcAnchor.value.scrollIntoView({behavior:'smooth'})}
    async function gcSend(){
      const el=gcInputEl.value;const txt=el?el.innerText.trim():'';
      if(!txt||gcTyping.value||!gcActiveGroup.value)return;
      if(el){el.innerText='';gcHasInput.value=false}
      const gid=gcActiveGroup.value.id;const now=new Date();const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      if(!gcAllMsgs.value[gid])gcAllMsgs.value[gid]=[];
      gcAllMsgs.value[gid].push({charId:'user',content:txt,time:t,ts:now.getTime(),retracted:false});
      gcSaveMsgs();gcActiveGroup.value.lastMsg=txt;gcActiveGroup.value.lastTime=t;gcSaveGroups();
      await nextTick(gcScrollB);await gcAIRound('user',txt);
    }
    async function gcTriggerAI(){if(gcTyping.value||!gcActiveGroup.value)return;await gcAIRound('free',null)}
    async function gcAIRound(trigger,userTxt){
      if(!api.value.url||!api.value.key)return;
      const g=gcActiveGroup.value;const gid=g.id;
      const aiMembers=g.memberIds.filter(id=>id!=='user').map(id=>gcGetChar(id)).filter(Boolean);
      if(aiMembers.length===0)return;
      let participants=aiMembers.length<=4?[...aiMembers]:[...aiMembers].sort(()=>Math.random()-.5).slice(0,4);
      participants=[...participants].sort(()=>Math.random()-.5);
      gcTyping.value=true;await nextTick(gcScrollB);
      const now=new Date();const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      try{
        const recentMsgs=(gcAllMsgs.value[gid]||[]).slice(-12).map(m=>{
          const name=m.charId==='user'?(userProfile.value.name||'用户'):gcGetChar(m.charId)?.name||'?';
          return`${name}：${m.retracted?'[已撤回]':m.content}`;
        }).join('\n');
        const memberInfo=participants.map(c=>{
          const mem=memoryLib.value[c.id];const memStr=mem?.length>0?mem.slice(-2).map(t=>t.items.map(i=>i.text).join('、')).join('\n'):'无';
          const dateKey=new Date().toISOString().slice(0,10);const sch=calSchedules.value[c.id]?.[dateKey];const schStr=sch?.items?sch.items.slice(0,3).map(s=>s.time+' '+s.title).join('，'):'无';
          return`【${c.name}】设定：${(c.system||'').slice(0,80)}。记忆：${memStr}。行程：${schStr}。`;
        }).join('\n');
        const sys=`你是群聊「${g.name}」的内容生成器。群成员：${g.memberIds.map(id=>id==='user'?(userProfile.value.name||'用户'):gcGetChar(id)?.name||'?').join('、')}。
${memberInfo}
${trigger==='user'?`用户刚说：「${userTxt}」`:'这是AI自由发言时间，根据各自行程和个性自然聊天。'}
【绝对禁止OOC】每个角色发言必须100%符合其性格设定。为以下成员各生成一句发言，每句10-35字口语化，后面的人可回应前面，用各自母语，纯母语放content禁止括号翻译，翻译放translation。
发言顺序：${participants.map(c=>c.name).join(' → ')}
只输出JSON数组：[{"name":"角色名","content":"纯母语发言","translation":"中文翻译"}]，严格按顺序，只输出JSON。`;
        const res=await fetch(api.value.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.value.key},body:JSON.stringify({model:api.value.model,messages:[{role:'system',content:sys},{role:'user',content:`最近群聊记录：\n${recentMsgs||'（暂无）'}`}],stream:false,max_tokens:600})});
        const data=await res.json();if(data.error)throw new Error(data.error.message);
        const arr=JSON.parse((data.choices?.[0]?.message?.content||'[]').replace(/```json|```/g,'').trim());
        if(!gcAllMsgs.value[gid])gcAllMsgs.value[gid]=[];
        for(let pi=0;pi<arr.length;pi++){
          const item=arr[pi];
          const c=participants.find(x=>x.name===item.name)||participants[pi];
          if(!c||!item.content)continue;
          gcAllMsgs.value[gid].push({charId:c.id,content:item.content.trim(),time:t,ts:Date.now()+pi,retracted:false});
          if(!allMsgs.value[c.id])allMsgs.value[c.id]=[];
          allMsgs.value[c.id].push({role:'assistant',content:`[群聊${g.name}] ${item.content.trim()}`,time:t,ts:Date.now()+pi});
        }
        gcSaveMsgs();saveMsgs();
        if(arr.length>0){const last=arr[arr.length-1];const lc=participants.find(x=>x.name===last?.name)||participants[participants.length-1];gcActiveGroup.value.lastMsg=(lc?.name||'')+'：'+(last?.content||'').slice(0,15);gcActiveGroup.value.lastTime=t;gcSaveGroups();}
        await nextTick(gcScrollB);
      }catch(e){
        if(!gcAllMsgs.value[gid])gcAllMsgs.value[gid]=[];
        gcAllMsgs.value[gid].push({charId:participants[0]?.id||'',content:'⚠️ '+e.message,time:t,ts:Date.now(),retracted:false});
        gcSaveMsgs();
      }finally{gcTyping.value=false;await nextTick(gcScrollB)}
    }
    function gcLongpressStart(e,msg,idx){gcLpTimer=setTimeout(()=>{const touch=e.touches?.[0]||e;const x=Math.min(touch.clientX,window.innerWidth-150);const y=Math.max(touch.clientY-130,60);gcActionMenu.value={msg,idx,x,y}},500)}
    function gcLongpressEnd(){clearTimeout(gcLpTimer)}
    function gcShowMenu(e,msg,idx){const x=Math.min(e.clientX,window.innerWidth-150);const y=Math.max(e.clientY-130,60);gcActionMenu.value={msg,idx,x,y}}
    function gcRetract(msg,idx){const gid=gcActiveGroup.value?.id;if(!gid)return;const msgs=gcAllMsgs.value[gid];if(msgs&&msgs[idx]){msgs[idx].retracted=true;gcSaveMsgs()}gcActionMenu.value=null}
    function gcDelete(idx){const gid=gcActiveGroup.value?.id;if(!gid)return;const msgs=gcAllMsgs.value[gid];if(msgs){msgs.splice(idx,1);gcSaveMsgs()}gcActionMenu.value=null}

    function invOpenChat(item){
      const c=invTarget.value;
      const userName=(userProfile.value?.name||'用户');
      if(item.isUserChat||item.name===userName){
        const realMsgs=(allMsgs.value[c?.id]||[]).map(m=>({
          isMe:m.role==='assistant',
          content:m.role==='assistant'?(m.bubbles?m.bubbles.join(' '):m.content):m.content
        }));
        invChatDetail.value={...item,name:userName,messages:realMsgs};
        return;
      }
      invChatDetail.value={...item,messages:item.messages||[]};
    }

    return{
      pg,T,D,typing,hasInput,previewImg,
      showSt,showAdd,showEditChar,showSidebar,showEmojiPanel,
      showWhisperMask,whisperText,whisperLoading,whisperCharName,triggerWhisper,rcheckAlert,rcheckActive,rcheckChar,rcheckWhisper,rcheckBlock,rcheckAllow,rcheckFinish,rcheckGrabBack,rcheckEnd,
      activeChar,msgBox,anchor,inputEl,avInput,
      wall,wallSt,preWP,chars,curMsgs,api,nc,emojis,
      wipList,wipI,totalUnread,calM,todayN,weekDays,
      charSettings,minimaxVoices,fetchingModels,modelList,userAvatar,
      memoryChar,memorySummarizing,currentMemory,memoryLib,
      allMoments,userProfile,editProfile,momentsBg,momentGenerating,
      showPostMoment,showEditProfile,newMomentText,newMomentImg,
      previewFake,previewReal,userMoments,
      unlock,go,openChat,lastMsg,lastTime,showT,formatMsgTime,isLastInGroup,speakBubbles,
      isFullscreen,toggleFullscreen,
      weatherTemp,weatherDesc,weatherIcon,weatherLoading,fetchWeather,
      onInput,onInputFocus,onInputBlur,insertEmoji,toggleTrans,
      swipeStart,swipeEnd,
      msgActionMenu,msgLongpressStart,msgLongpressEnd,msgShowMenu,msgRetract,msgDelete,
      triggerAiReply,
      emojiTab,stickerList,stickerUrlInput,showStickerMgmt,
      addStickerUrl,addStickerFile,removeSticker,sendSticker,
      mbTab,mbCharId,mbGenerating,mbShowWrite,mbNewQuestion,
      mbCharLetters,mbUserLetters,mbAllLetters,
      mbGenerateCharLetters,mbCharReply,mbUserReply,mbSubmitQuestion,
      groups,gcActiveGroup,gcShowCreate,gcShowSettings,gcShowEmojiPanel,
      gcTyping,gcHasInput,gcInputEl,gcMsgBox,gcAnchor,gcActionMenu,gcShowTrans,
      gcNewName,gcNewMembers,gcNewWithUser,gcCurMsgs,
      gcGetChar,gcAvatars,gcOpen,gcToggleMember,gcCreate,gcDisband,gcUploadAvatar,
      gcOnInput,gcInsertEmoji,gcSend,gcTriggerAI,
      gcLongpressStart,gcLongpressEnd,gcShowMenu,gcRetract,gcDelete,
      triggerWhisper,send,sendImage,
      fetchModels,openEditChar,clearMemory,deleteChar,saveChar,uploadAvatar,
      setWP,upWP,saveSt,
      addMemoryTag,deleteMemoryTag,addMemoryItem,deleteMemoryItem,
      clearCharMemory,summarizeMemory,saveMemoryLib,
      exportData,importData,
      getChar,getCharName,toggleLike,submitComment,postMoment,generateMoments,
      uploadProfileAv,pickMomentImg,saveProfile,
      musicPlaylist,musicCurrentIdx,musicCurrent,musicPlaying,musicProgress,
      musicShowSearch,musicShowPlaylist,musicKw,musicSearchRes,musicSearching,
      musicActiveChar,musicReactions,musicReacting,
      musicTogglePlay,musicNext,musicPrev,musicPlayAt,musicSeek,
      musicSelectChar,musicRemove,musicSearch,musicAddSong,
      wbBooks,wbRows,wbCurrent,wbShowAdd,wbNew,wbKwInput,
      wbCreate,wbOpen,wbDelete,wbAddKw,wbRemoveKw,wbSave,wbAutoSave,
      calUserEvents,calSchedules,calShowUser,calCharView,calGenerating,
      calShowAddEvent,calSelectedDate,calViewYear,calViewMonth,calNewEvent,
      calDays,calTodayUserEvents,calEventColors,calCurrentSchedule,calCurrentMood,
      calEventsForDate,calPrevMonth,calNextMonth,calAddEvent,calDeleteEvent,
      calIsPast,calOpenChar,calGenerateSchedule,
      doorMeetings,doorActiveChar,doorOpenChar,
      meetTyping,meetHasInput,meetInputEl,meetMsgBox,meetAnchor,
      meetShowSettings,meetCurrentSession,meetCurrentBlocks,
      meetLongpressBlock,meetEditText,meetConfig,
      meetLocationPresets,meetTimePresets,meetVibePresets,
      meetStartNew,meetOnInput,meetSend,meetGenerate,meetEndMeeting,
      meetStartLongpress,meetCancelLongpress,meetSaveEdit,meetDeleteBlock,
      forumTabs,forumTab,forumBottomTab,forumSearchKw,forumPosts,forumName,forumSlogan,
      forumGenerating,forumDetailPost,forumReplyTyping,forumReplyHasInput,
      forumReplyInputEl,forumDetailBody,forumReplyAnchor,forumShowPost,
      forumPreviewImg,forumRealPreview,forumNewPost,forumFilteredPosts,
      forumTagColor,forumDoSearch,forumToggleLike,forumRefresh,forumOpenPost,forumGenAllReplies,
      forumReplyOnInput,forumSendReply,forumPickImg,forumPickPostImg,forumSubmitPost,
      invPasswords,invTarget,invPhase,invPwdInput,invPwdErr,invProgress,invConnLog,invPwdMaxLen,invPhoneLoading,
      invOpenedApp,invAppData,invAppTitle,
      invPhotoDetail,invPhotoPassword,invPhotoUnlocked,invPhotoErr,
      invChatDetail,invChatLoading,invMemoDetail,invMemoPassword,invMemoErr,
      invStart,invTryPwd,invLoadAllData,invUnlockMemo,invExit,invNumPress,
      invOpenPhoto,invUnlockPhoto,invOpenChat,invToggleMemo,invUnlockMemoItem,invCalcBalance,
      bbShelfItems,bbTodayItem,bbUsedToday,bbNextResetTimer,bbOpenAnim,
      bbDialogActive,bbDialogChar,bbDialogStep,bbDialogHistory,bbDialogTyping,
      bbChoices,bbDialogMsgs,bbDialogAnchor,
      bbFanficActive,bbFanficText,bbFanficGenerating,bbFanficProgress,
      bbShowShelf,bbShelfDetailItem,
      bbDraw,bbStartDialog,bbPickChoice,bbViewShelfItem,
    };
  }
}).mount('#app');
