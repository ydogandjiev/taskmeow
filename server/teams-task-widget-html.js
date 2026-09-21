export function getTeamsTaskWidgetHtml(stageViewUrl) {
  const serializedStageViewUrl = JSON.stringify(stageViewUrl).replace(
    /</g,
    "\\u003c"
  );

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:light dark;--bg:#fff;--panel:#f5f5f5;--hover:#eee;--text:#242424;--muted:#666;--border:#ddd;--accent:#5b5fc7;--danger:#c4314b}
[data-theme="dark"]{--bg:#292929;--panel:#333;--hover:#3d3d3d;--text:#fff;--muted:#bbb;--border:#555}
*{box-sizing:border-box}body{margin:0;padding:14px;background:var(--bg);color:var(--text);font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.widget{max-width:640px;margin:auto}.header,.add,.task{display:flex;align-items:center}.header{gap:8px;margin-bottom:12px}.header h1{font-size:18px;margin:0}.count{margin-left:auto;background:var(--accent);color:#fff;border-radius:12px;padding:2px 8px;font-size:12px;font-weight:700}
button,input{font:inherit}.icon{border:0;background:transparent;color:var(--muted);cursor:pointer;border-radius:5px;padding:5px}.icon:hover{background:var(--hover);color:var(--text)}
.add{gap:8px;margin-bottom:12px}.add input{min-width:0;flex:1;padding:9px 11px;border:1px solid var(--border);border-radius:7px;background:var(--bg);color:var(--text)}.add button{border:0;border-radius:7px;padding:9px 14px;background:var(--accent);color:#fff;font-weight:600;cursor:pointer}
.tasks{display:flex;flex-direction:column;gap:6px}.task{gap:7px;padding:9px 10px;border:1px solid transparent;border-radius:7px;background:var(--panel)}.task:hover{border-color:var(--border);background:var(--hover)}.task.drag{opacity:.45}.task.over{border-color:var(--accent)}
.grip{cursor:grab;color:var(--muted)}.star{font-size:18px;color:#d29200}.title{flex:1;word-break:break-word}.delete:hover{color:var(--danger)}.empty,.loading{padding:28px;text-align:center;color:var(--muted)}
.error{display:none;margin-bottom:10px;padding:8px 10px;border-left:3px solid var(--danger);background:#fde7e9;color:var(--danger);border-radius:4px}
.footer{margin-top:12px;padding-top:10px;border-top:1px solid var(--border);text-align:center}.footer a{color:var(--accent);font-weight:600;text-decoration:none}.footer a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="widget">
  <div class="header"><h1>✓ My Tasks</h1><span class="count" id="count">0</span><button class="icon" id="expand" title="Maximize">⛶</button></div>
  <div class="error" id="error"></div>
  <div class="add"><input id="newTask" placeholder="Add a new task..." autocomplete="off"><button id="addTask">Add</button></div>
  <div class="tasks" id="tasks"><div class="loading">Loading tasks...</div></div>
  <div class="footer"><a href="#" id="stageView">Open full screen with chat ↗</a></div>
</div>
<script>
(function(){
  var STAGE_VIEW_URL=${serializedStageViewUrl},PROTOCOL_VERSION="2026-01-26",tasks=[],pending={},sequence=0,dragIndex=null,displayMode="inline";
  var list=document.getElementById("tasks"),count=document.getElementById("count"),input=document.getElementById("newTask");

  function post(message){window.parent.postMessage(message,"*")}
  function request(method,params){
    var id="taskmeow-"+(++sequence);
    post({jsonrpc:"2.0",id:id,method:method,params:params||{}});
    return new Promise(function(resolve,reject){pending[id]={resolve:resolve,reject:reject}})
  }
  function notify(method,params){post({jsonrpc:"2.0",method:method,params:params||{}})}
  function callTool(name,args){return request("tools/call",{name:name,arguments:args||{}})}
  function reportSize(){notify("ui/notifications/size-changed",{height:document.body.scrollHeight})}
  function toolResult(result){return result&&result.callToolResult?result.callToolResult:result}
  function structured(result){result=toolResult(result);return result&&(result.structuredContent||result)}
  function contentTask(result){
    result=toolResult(result);
    try{return JSON.parse(result.content[0].text).task}catch(e){return null}
  }
  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})
  }
  function showError(message){
    var element=document.getElementById("error");
    element.textContent=message;
    element.style.display="block";
    setTimeout(function(){element.style.display="none"},4000)
  }
  function sorted(){return tasks.slice().sort(function(a,b){return (a.order||0)-(b.order||0)})}
  function render(){
    var ordered=sorted();
    count.textContent=ordered.length;
    if(!ordered.length){list.innerHTML='<div class="empty">No tasks yet. Add one above!</div>';reportSize();return}
    list.innerHTML=ordered.map(function(task,index){
      return '<div class="task" draggable="true" data-index="'+index+'">'+
        '<span class="grip" title="Drag to reorder">⋮⋮</span>'+
        '<button class="icon star" data-action="star" data-id="'+escapeHtml(task.id)+'" title="'+(task.starred?"Unstar":"Star")+'">'+(task.starred?"★":"☆")+'</button>'+
        '<span class="title">'+escapeHtml(task.title)+'</span>'+
        '<button class="icon delete" data-action="delete" data-id="'+escapeHtml(task.id)+'" title="Delete">×</button></div>'
    }).join("");
    Array.prototype.forEach.call(list.querySelectorAll(".task"),function(element){
      element.addEventListener("dragstart",function(){dragIndex=Number(element.dataset.index);element.classList.add("drag")});
      element.addEventListener("dragend",function(){dragIndex=null;element.classList.remove("drag");clearOver()});
      element.addEventListener("dragover",function(event){event.preventDefault();clearOver();element.classList.add("over")});
      element.addEventListener("drop",function(event){event.preventDefault();reorder(dragIndex,Number(element.dataset.index))})
    });
    Array.prototype.forEach.call(list.querySelectorAll("[data-action]"),function(button){
      button.addEventListener("click",function(){
        if(button.dataset.action==="star")toggleStar(button.dataset.id);
        if(button.dataset.action==="delete")deleteTask(button.dataset.id)
      })
    });
    reportSize()
  }
  function clearOver(){Array.prototype.forEach.call(list.querySelectorAll(".over"),function(element){element.classList.remove("over")})}
  function load(result){
    var data=structured(result);
    if(data&&Array.isArray(data.tasks)){tasks=data.tasks;render()}
  }
  function addTask(){
    var title=input.value.trim();
    if(!title)return;
    input.value="";
    callTool("create_task",{title:title}).then(function(result){
      var task=contentTask(result);
      if(task){tasks.push(task);render()}else{return refresh()}
    }).catch(function(error){showError(error.message||"Could not create task")})
  }
  function deleteTask(id){
    var previous=tasks.slice();
    tasks=tasks.filter(function(task){return task.id!==id});
    render();
    callTool("delete_task",{taskId:id}).catch(function(error){tasks=previous;render();showError(error.message||"Could not delete task")})
  }
  function toggleStar(id){
    var task=tasks.find(function(item){return item.id===id});
    if(!task)return;
    task.starred=!task.starred;
    render();
    callTool("update_task",{taskId:id,starred:task.starred}).catch(function(error){task.starred=!task.starred;render();showError(error.message||"Could not update task")})
  }
  function reorder(from,to){
    clearOver();
    if(from===null||from===to)return;
    var ordered=sorted(),moved=ordered.splice(from,1)[0];
    ordered.splice(to,0,moved);
    ordered.forEach(function(task,index){task.order=index});
    tasks=ordered;
    render();
    callTool("update_task",{taskId:moved.id,order:to}).catch(function(error){showError(error.message||"Could not reorder tasks")})
  }
  function refresh(){return callTool("get_tasks",{}).then(load).catch(function(error){showError(error.message||"Could not load tasks")})}
  function applyContext(context){
    if(context&&context.theme)document.documentElement.setAttribute("data-theme",context.theme);
    if(context&&context.displayMode)displayMode=context.displayMode
  }

  document.getElementById("addTask").addEventListener("click",addTask);
  input.addEventListener("keydown",function(event){if(event.key==="Enter")addTask()});
  document.getElementById("stageView").addEventListener("click",function(event){
    event.preventDefault();
    request("ui/open-link",{url:STAGE_VIEW_URL}).then(function(result){
      if(result&&result.isError)showError("Teams could not open the collaborative view")
    }).catch(function(error){showError(error.message||"Could not open the collaborative view")})
  });
  document.getElementById("expand").addEventListener("click",function(){
    var target=displayMode==="fullscreen"?"inline":"fullscreen";
    request("ui/request-display-mode",{mode:target}).then(function(result){displayMode=result&&result.mode||target}).catch(function(error){showError(error.message||"Could not change display mode")})
  });

  window.addEventListener("message",function(event){
    var message=event.data;
    if(typeof message==="string"){try{message=JSON.parse(message)}catch(e){return}}
    if(!message||message.jsonrpc!=="2.0")return;
    if(message.id!==undefined&&!message.method&&("result" in message||"error" in message)){
      var callback=pending[String(message.id)];
      if(!callback)return;
      delete pending[String(message.id)];
      if(message.error)callback.reject(new Error(message.error.message||"Tool call failed"));
      else callback.resolve(message.result);
      return
    }
    if(message.method==="ui/notifications/tool-result")load(message.params||{});
    if(message.method==="ui/notifications/host-context-changed")applyContext(message.params||{})
  });

  request("ui/initialize",{protocolVersion:PROTOCOL_VERSION,appInfo:{name:"taskmeow-teams-widget",version:"1.0.0"},appCapabilities:{}})
    .then(function(result){
      applyContext(result&&result.hostContext);
      notify("ui/notifications/initialized");
      if(result&&result.toolResult)load(result.toolResult);
      else refresh();
      reportSize()
    })
    .catch(function(error){showError(error.message||"Could not initialize widget");reportSize()});
  reportSize()
})();
</script>
</body>
</html>`;
}
