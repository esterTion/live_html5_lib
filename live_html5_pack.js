/*!
 *
 * danmaku shield - biliplus
 * 
 * @author esterTion
 *
 */
/*
	功能预想：
	文本屏蔽（开启/关闭正则）
	用户屏蔽（通过右键菜单增加）
	颜色屏蔽（通过右键菜单增加）
	重复屏蔽
*/
var shield=(function(){
	var firstTime=!0,hidden=1,list=null,activeTab=0,useReg=!1,textList=[],$=function(a){return document.querySelectorAll(a)},$$=function(a){return document.querySelector(a)},limit,playerInstance=null,
	obj={
		init:function(player){
			if(!firstTime)
				return;
			if(player!=undefined)
				playerInstance=player;
			firstTime=!1;
			shield.tab(0);
			if(localStorage.shieldList==undefined)
				localStorage.shieldList='{"text":[],"user":[],"color":[],"useReg":false}';
			list=JSON.parse(localStorage.shieldList);
			if(list.color==undefined)
				list.color=[];
			if(list.useReg==undefined)
				list.useReg=!1;
			useReg=list.useReg;
			limit=list.limit;
			obj.render();
			var i,len,tabs;
			tabs=$('.shield_tab');
			for(i=0,len=tabs.length;i<len;i++){
				tabs[i].tabNum=i;
				tabs[i].addEventListener('mouseenter',function(){obj.tab(this.tabNum)});
				tabs[i].addEventListener('mouseleave',function(e){
					var border=this.getBoundingClientRect(),
					x=e.clientX,y=e.clientY;
					if(
						(x-border.left<0) || (x-border.left>border.width) ||
						(y-border.top<0) || (y-border.top>border.height)
					)
						obj.tab(activeTab)
				});
				tabs[i].addEventListener('click',function(){obj.switchTab(this.tabNum)});
			}
			$$('.shield-enrty').addEventListener('click',shield.show);
			$$('.shield .close').addEventListener('click',shield.show);
			$$('.shield .add').addEventListener('click',shield.add);
			$$('#useReg').addEventListener('click',function(){
				useReg=!useReg;
				obj.save();
				obj.render(3);
			});
		},
		switchTab:function(offset){
			activeTab=offset;
			$$('.shield_body_wrapper').style.transform='translateX('+offset*-278+'px)';
			$$('.shield_body_wrapper').style.webkitTransform='translateX('+offset*-278+'px)';
		},
		tab:function(offset){
			var container=$$('.shield'),containerBorder=container.getBoundingClientRect(),
			moveTo=$$('.shield .shield_tab:nth-of-type('+(offset+1)+')>div').getBoundingClientRect(),
			left=moveTo.left-containerBorder.left,
			width=moveTo.width,
			tab=$$('.shield .shield_tab_slash');
			tab.style.left=left+'px';
			tab.style.width=width+'px';
		},
		render:function(part){
			var doAll=!0,tab=0;
			if(part!=undefined){
				doAll=!1,tab=part;
			}
			while(1){switch(tab){
				case 0:
				//文本
					var str='',i,len,del;
					for(i=0,len=list.text.length;i<len;i++){
						str+='<div class="shield_item"><div class="text">'+list.text[i]+'</div><div class="delete"></div></div>';
					}
					$$('#shield_text').innerHTML=str;
					del=$('#shield_text .shield_item .delete');
					for(i=0,len=del.length;i<len;i++){
						del[i].onclick=obj.del;
					}
				break;
				case 1:
					//用户
					var str='',i=0,del;
					for(;i<list.user.length;i++){
						str+='<div class="shield_item"><div class="text">'+list.user[i]+' mid '+crc_engine(list.user[i])+'</div><div class="delete"></div></div>';
					}
					if(i==0){
						str='<div class="shield_item">'+ABP.Strings.blockUserEmpty+'</div>'
					}
					$$('#shield_user').innerHTML=str;
					del=$('#shield_user .shield_item .delete');
					for(i=0,len=del.length;i<len;i++){
						del[i].onclick=obj.delUser;
					}
				break;
				case 2:
					//颜色
					var str='',i=0,color,del;
					for(;i<list.color.length;i++){
						color=list.color[i].toString(16);
						while(color.length<6){
							color='0'+color
						}
						str+='<div class="shield_color"><div class="color" style="background:#'+color+'">'+list.color[i]+'</div><div class="delete"></div></div>';
					}
					if(i==0){
						str='<div class="shield_color">'+ABP.Strings.blockColorEmpty+'</div>'
					}
					$$('#shield_color').innerHTML=str;
					del=$('#shield_color .shield_color .delete');
					for(i=0,len=del.length;i<len;i++){
						del[i].onclick=obj.delColor;
					}
				break;
				case 3:
					//设置
					$$('#useReg').className='shield_toggle'+(useReg?' on':'');
				break;
				default:
					return;
			}tab++;}
		},
		save:function(){
			list.useReg=useReg;
			list.limit=limit;
			localStorage.shieldList=JSON.stringify(list);
			obj.shield();
		},
		show:function(){
			if(hidden){
				$('.shield')[0].setAttribute('class','shield');
			}else{
				$('.shield')[0].setAttribute('class','shield hidden');
			}
			hidden^=1;
		},
		add:function(){
			obj.addText($$('.shield_item .new').value);
			$$('.shield_item .new').value='';
		},
		addText:function(text){
			var i,len;
			if(text=='' || list.text.indexOf(text)!=-1)
				return false;
			list.text.push(text);
			obj.save();
			obj.render(0);
		},
		addUser:function(user){
			if(list.user.indexOf(user)!=-1)
				return false;
			list.user.push(user);
			obj.save();
			obj.render(1);
		},
		addColor:function(color){
			color=parseInt(color,16);
			if(isNaN(color) || list.color.indexOf(color)!=-1)
				return false;
			list.color.push(color);
			obj.save();
			obj.render(2);
		},
		del:function(e){
			var newlist,delstr=e.target.parentNode.childNodes[0].innerHTML,index=list.text.indexOf(delstr);
			if(index==-1)
				return false;
			newlist=list.text.splice(0,index);
			list.text=newlist.concat(list.text.splice(1));
			obj.save();
			obj.render(0);
		},
		delUser:function(e){
			var newlist,delUser=e.target.parentNode.childNodes[0].innerHTML.split(' ')[0],index=list.user.indexOf(delUser);
			if(index==-1)
				return false;
			newlist=list.user.splice(0,index);
			list.user=newlist.concat(list.user.splice(1));
			obj.save();
			obj.render(1);
		},
		delColor:function(e){
			var newlist,delColor=e.target.parentNode.childNodes[0].innerHTML,index=list.color.indexOf(delColor*1);
			if(index==-1)
				return false;
			newlist=list.color.splice(0,index);
			list.color=newlist.concat(list.color.splice(1));
			obj.save();
			obj.render(2);
		},
		filterChk:function(cm){
			var j
			if(list.color.indexOf(cm.color)!=-1 || list.user.indexOf(cm.hash)!=-1){
				return false;
			}else{
				for(j=0;j<textList.length;j++){
					try{
					if(cm.text.match(textList[j])!=null)
						return false;
					}catch(e){}
				}
			}
			return true;
		},
		filter:function(cm){
			/*for(var i=0,len=list.text.length;i<len;i++){
				if(useReg){
					if(cm.text.match(new RegExp(list.text[i]))!=null)
						return false;
				}else{
					if(cm.text.match(list.text[i])!=null)
						return false;
				}
			}*/
			if(!shield.filterChk(cm)){
				return false;
			}
			if(!cm.filtered){
				cm.oriSize=cm.size;
				cm.filtered=!0;
			}
			cm.size=cm.oriSize*abpinst.commentScale;
			return cm;
		},
		shield:function(){
			textList=[];
			var onScreen=playerInstance.cmManager.runline,i,j,cm;
			for(j=0;j<list.text.length;j++){
				textList.push(useReg?new RegExp(list.text[j]):list.text[j]);
			}
			for(i=0;i<onScreen.length;i++){
				cm=onScreen[i];
				if(list.color.indexOf(cm.color)!=-1 || list.user.indexOf(cm.originalData.hash)!=-1){
					cm.finish();
					i--;
				}else{
					for(j=0;j<textList.length;j++){
						if(cm.text.match(j)!=null){
							cm.finish();
							i--;
							break;
						}
					}
				}
			}
		}
	};
	return obj;
})();
window.shield = shield;
unsafeWindow.shield = shield;
/*!
 *
 * Comment Core Library CommentManager
 * @license MIT
 * @author Jim Chen
 *
 * Copyright (c) 2014 Jim Chen
 *
 * XMLParsr
 * == Licensed Under the MIT License : /LICENSING
 * Copyright (c) 2012 Jim Chen ( CQZ, Jabbany )
 */
/**
 * Binary Search Stubs for JS Arrays
 * @license MIT
 * @author Jim Chen
 */
var BinArray = (function(){
	var BinArray = {};
	BinArray.bsearch = function(arr, what, how){
		if(arr.length === 0) {
			return 0;
		}
		if(how(what,arr[0]) < 0) {
			return 0;
		}
		if(how(what,arr[arr.length - 1]) >=0) {
			return arr.length;
		}
		var low =0;
		var i = 0;
		var count = 0;
		var high = arr.length - 1;
		while(low<=high){
			i = Math.floor((high + low + 1)/2);
			count++;
			if(how(what,arr[i-1])>=0 && how(what,arr[i])<0){
				return i;
			}
			if(how(what,arr[i-1])<0){
				high = i-1;
			}else if(how(what,arr[i])>=0){
				low = i;
			}else {
				console.error('Program Error');
			}
			if(count > 1500) { console.error('Too many run cycles.'); }
		}
		return -1; // Never actually run
	};
	BinArray.binsert = function(arr, what, how){
		var index = BinArray.bsearch(arr,what,how);
		arr.splice(index,0,what);
		return index;
	};
	return BinArray;
})();

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CommentSpaceAllocator = (function () {
    function CommentSpaceAllocator(width, height) {
        if (width === void 0) { width = 0; }
        if (height === void 0) { height = 0; }
        this._pools = [
            []
        ];
        this.avoid = 1;
        this._width = width;
        this._height = height;
    }
    CommentSpaceAllocator.prototype.willCollide = function (existing, check) {
        return existing.stime + existing.ttl >= check.stime + check.ttl / 2;
    };
    CommentSpaceAllocator.prototype.pathCheck = function (y, comment, pool) {
        var bottom = y + comment.height;
        var right = comment.right;
        for (var i = 0; i < pool.length; i++) {
            if (pool[i].y > bottom || pool[i].bottom < y) {
                continue;
            }
            else if (pool[i].right < comment.x || pool[i].x > right) {
                if (this.willCollide(pool[i], comment)) {
                    return false;
                }
                else {
                    continue;
                }
            }
            else {
                return false;
            }
        }
        return true;
    };
    CommentSpaceAllocator.prototype.assign = function (comment, cindex) {
        while (this._pools.length <= cindex) {
            this._pools.push([]);
        }
        var pool = this._pools[cindex];
        if (pool.length === 0) {
            comment.cindex = cindex;
            return 0;
        }
        else if (this.pathCheck(0, comment, pool)) {
            comment.cindex = cindex;
            return 0;
        }
        var y = 0;
        for (var k = 0; k < pool.length; k++) {
            y = pool[k].bottom + this.avoid;
            if (y + comment.height > this._height) {
                break;
            }
            if (this.pathCheck(y, comment, pool)) {
                comment.cindex = cindex;
                return y;
            }
        }
        return this.assign(comment, cindex + 1);
    };
    CommentSpaceAllocator.prototype.add = function (comment) {
        if (comment.height > this._height) {
            comment.cindex = -2;
            comment.y = 0;
        }
        else {
            comment.y = this.assign(comment, 0);
            BinArray.binsert(this._pools[comment.cindex], comment, function (a, b) {
                if (a.bottom < b.bottom) {
                    return -1;
                }
                else if (a.bottom > b.bottom) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
        }
    };
    CommentSpaceAllocator.prototype.remove = function (comment) {
        if (comment.cindex < 0) {
            return;
        }
        if (comment.cindex >= this._pools.length) {
            throw new Error("cindex out of bounds");
        }
        var index = this._pools[comment.cindex].indexOf(comment);
        if (index < 0)
            return;
        this._pools[comment.cindex].splice(index, 1);
    };
    CommentSpaceAllocator.prototype.setBounds = function (width, height) {
        this._width = width;
        this._height = height;
    };
    return CommentSpaceAllocator;
}());
var AnchorCommentSpaceAllocator = (function (_super) {
    __extends(AnchorCommentSpaceAllocator, _super);
    function AnchorCommentSpaceAllocator() {
        _super.apply(this, arguments);
    }
    AnchorCommentSpaceAllocator.prototype.add = function (comment) {
        _super.prototype.add.call(this, comment);
        comment.x = (this._width - comment.width) / 2;
    };
    AnchorCommentSpaceAllocator.prototype.willCollide = function (a, b) {
        return true;
    };
    AnchorCommentSpaceAllocator.prototype.pathCheck = function (y, comment, pool) {
        var bottom = y + comment.height;
        for (var i = 0; i < pool.length; i++) {
            if (pool[i].y > bottom || pool[i].bottom < y) {
                continue;
            }
            else {
                return false;
            }
        }
        return true;
    };
    return AnchorCommentSpaceAllocator;
}(CommentSpaceAllocator));
//# sourceMappingURL=CommentSpaceAllocator.js.map
var CoreComment = (function () {
    function CoreComment(parent, init) {
        if (init === void 0) { init = {}; }
        this.mode = 1;
        this.stime = 0;
        this.text = "";
        this.ttl = 4000;
        this.dur = 4000;
        this.cindex = -1;
        this.motion = [];
        this.movable = true;
        this._alphaMotion = null;
        this.absolute = true;
        this.align = 0;
        this._alpha = 1;
        this._size = 25;
        this._color = 0xffffff;
        this._border = false;
        this._shadow = true;
        this._font = "";
        if (!parent) {
            throw new Error("Comment not bound to comment manager.");
        }
        else {
            this.parent = parent;
        }
        if (init.hasOwnProperty("stime")) {
            this.stime = init["stime"];
        }
        if (init.hasOwnProperty("mode")) {
            this.mode = init["mode"];
        }
        else {
            this.mode = 1;
        }
        if (init.hasOwnProperty("dur")) {
            this.dur = init["dur"];
            this.ttl = this.dur;
        }
        this.dur *= this.parent.options.global.scale;
        this.ttl *= this.parent.options.global.scale;
        if( this.mode === 4 || this.mode === 5 ){
        	this.dur *= .6;
        	this.ttl *= .6;
        }
        if (init.hasOwnProperty("text")) {
            this.text = init["text"];
        }
        if (init.hasOwnProperty("motion")) {
            this._motionStart = [];
            this._motionEnd = [];
            this.motion = init["motion"];
            var head = 0;
            for (var i = 0; i < init["motion"].length; i++) {
                this._motionStart.push(head);
                var maxDur = 0;
                for (var k in init["motion"][i]) {
                    var m = init["motion"][i][k];
                    maxDur = Math.max(m.dur, maxDur);
                    if (m.easing === null || m.easing === undefined) {
                        init["motion"][i][k]["easing"] = CoreComment.LINEAR;
                    }
                }
                head += maxDur;
                this._motionEnd.push(head);
            }
            this._curMotion = 0;
        }
        if (init.hasOwnProperty("color")) {
            this._color = init["color"];
        }
        if (init.hasOwnProperty("size")) {
            this._size = init["size"];
        }
        if (init.hasOwnProperty("border")) {
            this._border = init["border"];
        }
        if (init.hasOwnProperty("opacity")) {
            this._alpha = init["opacity"];
        }
        if (init.hasOwnProperty("alpha")) {
            this._alphaMotion = init["alpha"];
        }
        if (init.hasOwnProperty("font")) {
            this._font = init["font"];
        }
        if (init.hasOwnProperty("x")) {
            this._x = init["x"];
        }
        if (init.hasOwnProperty("y")) {
            this._y = init["y"];
        }
        if (init.hasOwnProperty("shadow")) {
            this._shadow = init["shadow"];
        }
        if (init.hasOwnProperty("position")) {
            if (init["position"] === "relative") {
                this.absolute = false;
                if (this.mode < 7) {
                    console.warn("Using relative position for CSA comment.");
                }
            }
        }
    }
    CoreComment.prototype.init = function (recycle) {
        if (recycle === void 0) { recycle = null; }
        if (recycle !== null) {
            this.dom = recycle.dom;
        }
        else {
            this.dom = document.createElement("div");
        }
        this.dom.className = this.parent.options.global.className;
        this.dom.appendChild(document.createTextNode(this.text));
        this.dom.textContent = this.text;
        this.dom.innerText = this.text;
        this.size = this._size;
        if (this._color != 0xffffff) {
            this.color = this._color;
        }
        this.shadow = this._shadow;
        if (this._border) {
            this.border = this._border;
        }
        if (this._font !== "") {
            this.font = this._font;
        }
        if (this._x !== undefined) {
            this.x = this._x;
        }
        if (this._y !== undefined) {
            this.y = this._y;
        }
        if (this._alpha !== 1 || this.parent.options.global.opacity < 1) {
            this.alpha = this._alpha;
        }
        if (this.motion.length > 0) {
            this.animate();
        }
    };
    Object.defineProperty(CoreComment.prototype, "x", {
        get: function () {
            if (this._x === null || this._x === undefined) {
                if (this.align % 2 === 0) {
                    this._x = this.dom.offsetLeft;
                }
                else {
                    this._x = this.parent.width - this.dom.offsetLeft - this.width;
                }
            }
            if (!this.absolute) {
                return this._x / this.parent.width;
            }
            return this._x;
        },
        set: function (x) {
            this._x = x;
            if (!this.absolute) {
                this._x *= this.parent.width;
            }
            if (this.align % 2 === 0) {
                this.dom.style.left = this._x + "px";
            }
            else {
                this.dom.style.right = this._x + "px";
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "y", {
        get: function () {
            if (this._y === null || this._y === undefined) {
                if (this.align < 2) {
                    this._y = this.dom.offsetTop;
                }
                else {
                    this._y = this.parent.height - this.dom.offsetTop - this.height;
                }
            }
            if (!this.absolute) {
                return this._y / this.parent.height;
            }
            return this._y;
        },
        set: function (y) {
            this._y = y;
            if (!this.absolute) {
                this._y *= this.parent.height;
            }
            if (this.align < 2) {
                this.dom.style.top = this._y + "px";
            }
            else {
                this.dom.style.bottom = this._y + "px";
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "bottom", {
        get: function () {
            return this.y + this.height;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "right", {
        get: function () {
            return this.x + this.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "width", {
        get: function () {
            if (this._width === null || this._width === undefined) {
                this._width = this.dom.offsetWidth;
            }
            return this._width;
        },
        set: function (w) {
            this._width = w;
            this.dom.style.width = this._width + "px";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "height", {
        get: function () {
            if (this._height === null || this._height === undefined) {
                this._height = this.dom.offsetHeight;
            }
            return this._height;
        },
        set: function (h) {
            this._height = h;
            this.dom.style.height = this._height + "px";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "size", {
        get: function () {
            return this._size;
        },
        set: function (s) {
            this._size = s;
            this.dom.style.fontSize = this._size + "px";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "color", {
        get: function () {
            return this._color;
        },
        set: function (c) {
            this._color = c;
            var color = c.toString(16);
            color = color.length >= 6 ? color : new Array(6 - color.length + 1).join("0") + color;
            this.dom.style.color = "#" + color;
            if (this._color === 0) {
                this.dom.className = this.parent.options.global.className + " rshadow";
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "alpha", {
        get: function () {
            return this._alpha;
        },
        set: function (a) {
            this._alpha = a;
            this.dom.style.opacity = Math.min(this._alpha, this.parent.options.global.opacity) + "";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "border", {
        get: function () {
            return this._border;
        },
        set: function (b) {
            this._border = b;
            if (this._border) {
                this.dom.style.border = "1px solid #00ffff";
            }
            else {
                this.dom.style.border = "none";
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "shadow", {
        get: function () {
            return this._shadow;
        },
        set: function (s) {
            this._shadow = s;
            if (!this._shadow) {
                this.dom.className = this.parent.options.global.className + " noshadow";
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreComment.prototype, "font", {
        get: function () {
            return this._font;
        },
        set: function (f) {
            this._font = f;
            if (this._font.length > 0) {
                this.dom.style.fontFamily = this._font;
            }
            else {
                this.dom.style.fontFamily = "";
            }
        },
        enumerable: true,
        configurable: true
    });
    CoreComment.prototype.time = function (time) {
        this.ttl -= time;
        if (this.ttl < 0) {
            this.ttl = 0;
        }
        if (this.movable) {
            this.update();
        }
        if (this.ttl <= 0) {
            this.finish();
        }
    };
    CoreComment.prototype.update = function () {
        this.animate();
    };
    CoreComment.prototype.invalidate = function () {
        this._x = null;
        this._y = null;
        this._width = null;
        this._height = null;
    };
    CoreComment.prototype._execMotion = function (currentMotion, time) {
        for (var prop in currentMotion) {
            if (currentMotion.hasOwnProperty(prop)) {
                var m = currentMotion[prop];
                this[prop] = m.easing(Math.min(Math.max(time - m.delay, 0), m.dur), m.from, m.to - m.from, m.dur);
            }
        }
    };
    CoreComment.prototype.animate = function () {
        if (this._alphaMotion) {
            this.alpha = (this.dur - this.ttl) * (this._alphaMotion["to"] - this._alphaMotion["from"]) / this.dur + this._alphaMotion["from"];
        }
        if (this.motion.length === 0) {
            return;
        }
        var ttl = Math.max(this.ttl, 0);
        var time = (this.dur - ttl) - this._motionStart[this._curMotion];
        this._execMotion(this.motion[this._curMotion], time);
        if (this.dur - ttl > this._motionEnd[this._curMotion]) {
            this._curMotion++;
            if (this._curMotion >= this.motion.length) {
                this._curMotion = this.motion.length - 1;
            }
            return;
        }
    };
    CoreComment.prototype.stop = function () {
    };
    CoreComment.prototype.finish = function () {
        this.parent.finish(this);
    };
    CoreComment.prototype.toString = function () {
        return ["[", this.stime, "|", this.ttl, "/", this.dur, "]", "(", this.mode, ")", this.text].join("");
    };
    CoreComment.LINEAR = function (t, b, c, d) {
        return t * c / d + b;
    };
    return CoreComment;
}());
var ScrollComment = (function (_super) {
    __extends(ScrollComment, _super);
    function ScrollComment(parent, data) {
        _super.call(this, parent, data);
        this.dur *= this.parent.options.scroll.scale;
        this.ttl *= this.parent.options.scroll.scale;
    }
    Object.defineProperty(ScrollComment.prototype, "alpha", {
        set: function (a) {
            this._alpha = a;
            this.dom.style.opacity = Math.min(Math.min(this._alpha, this.parent.options.global.opacity), this.parent.options.scroll.opacity) + "";
        },
        enumerable: true,
        configurable: true
    });
    ScrollComment.prototype.init = function (recycle) {
        if (recycle === void 0) { recycle = null; }
        _super.prototype.init.call(this, recycle);
        this.x = this.parent.width;
        if (this.parent.options.scroll.opacity < 1) {
            this.alpha = this._alpha;
        }
        this.absolute = true;
    };
    ScrollComment.prototype.update = function () {
        this.x = (this.ttl / this.dur) * (this.parent.width + this.width) - this.width;
    };
    return ScrollComment;
}(CoreComment));
var CSSCompatLayer = (function () {
    function CSSCompatLayer() {
    }
    CSSCompatLayer.transform = function (dom, trans) {
        dom.style.transform = trans;
        dom.style["webkitTransform"] = trans;
        dom.style["msTransform"] = trans;
        dom.style["oTransform"] = trans;
    };
    return CSSCompatLayer;
}());
var CSSScrollComment = (function (_super) {
    __extends(CSSScrollComment, _super);
    function CSSScrollComment() {
        _super.apply(this, arguments);
        this._dirtyCSS = true;
    }
    Object.defineProperty(CSSScrollComment.prototype, "x", {
        get: function () {
            return (this.ttl / this.dur) * (this.parent.width + this.width) - this.width;
        },
        set: function (x) {
            if (typeof this._x === "number") {
                var dx = x - this._x;
                this._x = x;
                CSSCompatLayer.transform(this.dom, "translateX(" + dx + "px)");
            }
            else {
                this._x = x;
                if (!this.absolute) {
                    this._x *= this.parent.width;
                }
                if (this.align % 2 === 0) {
                    this.dom.style.left = this._x + "px";
                }
                else {
                    this.dom.style.right = this._x + "px";
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    CSSScrollComment.prototype.update = function () {
        if (this._dirtyCSS) {
            this.dom.style.transition = "transform " + this.ttl + "ms linear";
            this.x = -this.width;
            this._dirtyCSS = false;
        }
    };
    CSSScrollComment.prototype.invalidate = function () {
        _super.prototype.invalidate.call(this);
        this._dirtyCSS = true;
    };
    CSSScrollComment.prototype.stop = function () {
        this.dom.style.transition = "";
        this.x = this._x;
        this._x = null;
        this.x = (this.ttl / this.dur) * (this.parent.width + this.width) - this.width;
        this._dirtyCSS = true;
    };
    return CSSScrollComment;
}(ScrollComment));
//# sourceMappingURL=CSSComment.js.map
/** 
 * Comment Filters Module Simplified (only supports modifiers & types)
 * @license MIT
 * @author Jim Chen
 */
function CommentFilter(){
	this.modifiers = [];
	this.runtime = null;
	this.allowTypes = {
		"1":true,
		"4":true,
		"5":true,
		"6":true,
		"7":true,
		"8":true,
		"17":true
	};
	this.doModify = function(cmt){
		for(var k=0;k<this.modifiers.length;k++){
			cmt = this.modifiers[k](cmt);
		}
		return cmt;
	};
	this.beforeSend = function(cmt){
		return cmt;
	}
	this.doValidate = function(cmtData){
		if(!this.allowTypes[cmtData.mode])
			return false;
		return true;
	};
	this.addRule = function(rule){
		
	};
	this.addModifier = function(f){
		this.modifiers.push(f);
	};
	this.runtimeFilter = function(cmt){
		if(this.runtime == null)
			return cmt;
		return this.runtime(cmt);
	};
	this.setRuntimeFilter = function(f){
		this.runtime = f;
	}
}

var CommentManager = (function() {
	var getRotMatrix = function(yrot, zrot) {
		// Courtesy of @StarBrilliant, re-adapted to look better
		var DEG2RAD = Math.PI/180;
		var yr = yrot * DEG2RAD;
		var zr = zrot * DEG2RAD;
		var COS = Math.cos;
		var SIN = Math.sin;
		var matrix = [
			COS(yr) * COS(zr)    , COS(yr) * SIN(zr)     , SIN(yr)  , 0,
			(-SIN(zr))           , COS(zr)               , 0        , 0,
			(-SIN(yr) * COS(zr)) , (-SIN(yr) * SIN(zr))  , COS(yr)  , 0,
			0                    , 0                     , 0        , 1
		];
		// CSS does not recognize scientific notation (e.g. 1e-6), truncating it.
		for(var i = 0; i < matrix.length;i++){
			if(Math.abs(matrix[i]) < 0.000001){
				matrix[i] = 0;
			}
		}
		return "matrix3d(" + matrix.join(",") + ")";
	};
	var autoOpacityFromComment = function(count){
		return -Math.tanh((count-50)/25)/Math.PI*.8+.718;
	};
	var font = "-apple-system,Arial,'PingFang SC','STHeiti Light','Hiragino Kaku Gothic ProN','Microsoft YaHei'";

	function CommentManager(stageObject){
		var __timer = 0;
		var self = this;
		
		this._listeners = {};
		this._lastPosition = 0;
		
		this.stage = stageObject;
		this.paused = true;
		this.pausedTime = 0;
		this.canvas = document.createElement('canvas');
		this.canvasStatic = document.createElement('canvas');
		this.staticUpdate = false;
		this.canvasFPS = 0;
		self.canvas.style.width = '100%';
		self.canvas.style.height = '100%';
		self.stage.appendChild(self.canvas);
		self.canvasStatic.style.width = '100%';
		self.canvasStatic.style.height = '100%';
		self.canvasStatic.style.position='absolute';
		self.canvasStatic.style.top=0;
		self.canvasStatic.style.left=0;
		self.stage.appendChild(self.canvasStatic);
		this.options = {
			global:{
				opacity:1,
				scale:1,
				className:"cmt",
				useCSS:false,
				autoOpacity:false,
				autoOpacityVal:1
			},
			scroll:{
				opacity:1,
				scale:1
			},
			limit: 0
		};
		this.timeline = [];
		this.runline = [];
		this.position = 0;
		this.limiter = 0;
		this.filter = null;
		this.csa = {
			scroll: new CommentSpaceAllocator(0,0),
			top:new AnchorCommentSpaceAllocator(0,0),
			bottom:new AnchorCommentSpaceAllocator(0,0),
			reverse:new CommentSpaceAllocator(0,0),
			scrollbtm:new CommentSpaceAllocator(0,0)
		};
		
		/** Precompute the offset width **/
		this.width = this.stage.offsetWidth;
		this.height = this.stage.offsetHeight;
		var pauseTime = 0;
		this.startTimer = function(){
			if(__timer > 0)
				return;
			var lastTPos = new Date().getTime();
			var cmMgr = this;
			__timer = window.setInterval(function(){
				var elapsed = new Date().getTime() - lastTPos;
				lastTPos = new Date().getTime();
				cmMgr.onTimerEvent(elapsed,cmMgr);
				cmMgr.sendQueueLoader();
			},1e3/60);
			this.paused = false;
			this.pausedTime = Date.now() - pauseTime;
		};
		this.stopTimer = function(){
			window.clearInterval(__timer);
			__timer = 0;
			this.paused = true;
			pauseTime = Date.now();
		};
		var prevOpacity = this.options.global.opacity,
		ticking=false,
		canvasFPS=0,
		onScreenCommentCount=0,
		autoOpacity = function(){
			if(self.options.global.autoOpacity){
				if(self.options.global.useCSS){
					self.stage.style.opacity = autoOpacityFromComment(onScreenCommentCount);
				}else{
					self.options.global.autoOpacityVal = self.options.global.opacity * autoOpacityFromComment(onScreenCommentCount);
				}
			}
		};
		setInterval(function(){
			self.canvasFPS = canvasFPS;
			canvasFPS = 0;
		},1e3);
		this.addEventListener('enterComment',function(){
			onScreenCommentCount++;
			autoOpacity();
		});
		this.addEventListener('exitComment',function(){
			onScreenCommentCount--;
			autoOpacity();
		});
		this.canvasDrawerWrapper = function(now){
			if(ticking)return;
			if(!now)now=performance.now();
			ticking=true;
			canvasFPS++;
			self.canvasDrawer(now|0);
			ticking=false;
		};
		this.ttlRecalcAll=function(){
			this.runline.forEach(ttlRecalc);
		};
		var sendQueue=[];
		this.send = function(data){
			sendQueue.push(data);
		}
		this.sendQueueLoader = function(){
			var start = performance.now(),passed;
			while(sendQueue.length > 0){
				self.sendAsync(sendQueue.shift());
				passed = performance.now()-start;
				if(passed > 8)
					return;
			}
		}
		this.addEventListener('clear',function(){
			sendQueue=[];
		});
		
		requestAnimationFrame(this.canvasDrawerWrapper);
		(function(){
			var prevRatio = window.devicePixelRatio;
			window.addEventListener('resize',function(){
				var ratio = window.devicePixelRatio;
				if(prevRatio != ratio){
					self.runline.forEach(function(i){
						if(i.textData)
						commentCanvasDrawer(i)
					})
					prevRatio = ratio;
				}
				self.ttlRecalcAll();
			})
		})()
	}

	/** Public **/
	CommentManager.prototype.stop = function(){
		this.stopTimer();
        for(var i = 0; i < this.runline.length; i++){
            if(typeof this.runline[i].stop !== "undefined"){
                this.runline[i].stop();
            }
        }
	};

	CommentManager.prototype.start = function(){
		this.startTimer();
	};

	CommentManager.prototype.seek = function(time){
		this.position = BinArray.bsearch(this.timeline, time, function(a,b){
			if(a < b.stime) return -1
			else if(a > b.stime) return 1;
			else return 0;
		});
	};

	CommentManager.prototype.validate = function(cmt){
		if(cmt == null)
			return false;
		return this.filter.doValidate(cmt);
	};

	CommentManager.prototype.load = function(a){
		this.timeline = a;
		this.timeline.sort(function(a,b){
			if(a.stime > b.stime) return 2;
			else if(a.stime < b.stime) return -2;
			else{
				if(a.date > b.date) return 1;
				else if(a.date < b.date) return -1;
				else if(a.dbid != null && b.dbid != null){
					if(a.dbid > b.dbid) return 1;
					else if(a.dbid < b.dbid) return -1;
					return 0;
				}else
					return 0;
			}
		});
		this.dispatchEvent("load");
	};

	CommentManager.prototype.insert = function(c){
		var index = BinArray.binsert(this.timeline, c, function(a,b){
			if(a.stime > b.stime) return 2;
			else if(a.stime < b.stime) return -2;
			else{
				if(a.date > b.date) return 1;
				else if(a.date < b.date) return -1;
				else if(a.dbid != null && b.dbid != null){
					if(a.dbid > b.dbid) return 1;
					else if(a.dbid < b.dbid) return -1;
					return 0;
				}else
					return 0;
			}
		});
		if(index <= this.position){
			this.position++;
		}
		this.dispatchEvent("insert");
	};

	CommentManager.prototype.clear = function(){
		while(this.runline.length > 0){
			this.runline[0].finish();
		}
		this.dispatchEvent("clear");
		this.canvas.getContext('2d').clearRect(0,0,this.canvas.width,this.canvas.height);
		this.canvasStatic.getContext('2d').clearRect(0,0,this.canvasStatic.width,this.canvasStatic.height);
	};

	CommentManager.prototype.setBounds = function(){
		this.width = this.stage.offsetWidth;
		this.height= this.stage.offsetHeight;
		this.dispatchEvent("resize");
		for(var comAlloc in this.csa){
			this.csa[comAlloc].setBounds(this.width,this.height);
		}
		// Update 3d perspective
		this.stage.style.perspective = this.width * Math.tan(40 * Math.PI/180) / 2 + "px";
		this.stage.style.webkitPerspective = this.width * Math.tan(40 * Math.PI/180) / 2 + "px";
	};
	CommentManager.prototype.init = function(){
		this.setBounds();
		if(this.filter == null) {
			this.filter = new CommentFilter(); //Only create a filter if none exist
		}
	};
	CommentManager.prototype.time = function(time){
		time = time - 1;
		if(this.position >= this.timeline.length || Math.abs(this._lastPosition - time) >= 2000){
			this.seek(time);
			this._lastPosition = time;
			if(this.timeline.length <= this.position) {
				return;
			}
		}else{
			this._lastPosition = time;
		}
		for(;this.position < this.timeline.length;this.position++){
			if(this.timeline[this.position]['stime']<=time){
				if(this.options.limit > 0 && this.runline.length > this.limiter) {
					continue; // Skip comments but still move the position pointer
				} else if(this.validate(this.timeline[this.position])){
					this.send(this.timeline[this.position]);
				}
			}else{
				break;
			}
		}
	};
	CommentManager.prototype.canvasResize = function(){
		try{
		var w=this.width,h=this.height,devicePixelRatio=window.devicePixelRatio;
		this.canvas.width = this.canvas.offsetWidth * devicePixelRatio;
		this.canvasStatic.height = this.canvasStatic.offsetHeight * devicePixelRatio;
		this.ttlRecalcAll();
		canvasDrawStatic(this);
		canvasDrawScroll(this);
		
		}catch(e){
			console.error('shit happened! forcing CSS! ',e.message);
			this.useCSS(true);
			return;
		}
	};
	var canvasDrawStatic=function(cmMgr){
		var canvas=cmMgr.canvasStatic, ctx=canvas.getContext('2d'), devicePixelRatio = window.devicePixelRatio,
		canvasWidth, canvasHeight = cmMgr.height,
		x, y,
		maxWidth=[0],
		halfLeft;
		cmMgr.runline.forEach(function(cmt){
			if([4,5].indexOf(cmt.mode)!=-1){
				maxWidth.push(cmt._width);
			}
		});
		maxWidth=Math.min(cmMgr.width,Math.max.apply(Math,maxWidth));
		canvasWidth = maxWidth;
		halfLeft=(cmMgr.width-maxWidth)/2;
		
		if(maxWidth!=canvas.offsetWidth){
			canvas.style.width=maxWidth+'px';
			canvas.style.left='calc(50% - '+maxWidth/2+'px)'
			canvas.width=maxWidth * devicePixelRatio;
		}else{
			ctx.clearRect(0, 0, canvasWidth * devicePixelRatio, canvasHeight * devicePixelRatio);
		}
		
		ctx.globalAlpha=cmMgr.options.global.autoOpacity ? cmMgr.options.global.autoOpacityVal : cmMgr.options.global.opacity;
		cmMgr.runline.forEach(function(cmt){
			if(!cmt.textData)return;
			switch(cmt.mode){
				case 4:
					//bottom
					cmt.x = (canvasWidth - cmt.width) / 2+halfLeft;
					x = cmt.x-halfLeft;
					y = (canvasHeight - cmt.y - cmt.height);
				break;
				case 5:
					//top
					cmt.x = (canvasWidth - cmt.width) / 2+halfLeft;
					x = cmt.x-halfLeft;
					y = (cmt.y);
				break;
				default:
					return;
			}
			ctx.drawImage(cmt.textData, round(x * devicePixelRatio), round(y * devicePixelRatio));
		});
	},
	canvasDrawScroll=function(cmMgr){
		//console.log('static call',performance.now())
		var canvas=cmMgr.canvas, ctx=canvas.getContext('2d'), devicePixelRatio = window.devicePixelRatio,
		canvasWidth = cmMgr.width, canvasHeight,
		x, y,
		drawCount=0,
		maxBottomLine=[0];
		cmMgr.runline.forEach(function(cmt){
			if(cmt.mode==1){
				maxBottomLine.push(cmt._y+cmt._height);
			}
		});
		maxBottomLine=Math.max.apply(Math,maxBottomLine);
		canvasHeight=maxBottomLine;
		
		if(canvas.offsetHeight!=maxBottomLine){
			canvas.style.height=maxBottomLine+'px';
			canvas.height=maxBottomLine * devicePixelRatio;
		}else{
			ctx.clearRect(0, 0, canvasWidth * devicePixelRatio, canvasHeight * devicePixelRatio);
		}
		
		ctx.globalAlpha=cmMgr.options.global.autoOpacity ? cmMgr.options.global.autoOpacityVal : cmMgr.options.global.opacity;
		cmMgr.runline.forEach(function(cmt){
			if(!cmt.textData)return;
			switch(cmt.mode){
				case 1:
					//scroll
					cmt.x = canvasWidth - cmt.rx;
					x = (canvasWidth - cmt.rx);
					y = cmt.y;
				break;
				default:
				return;
			}
			ctx.drawImage(cmt.textData, round(x * devicePixelRatio), round(y * devicePixelRatio));
		});
	}
	CommentManager.prototype.canvasDrawer = function(){
		if(this.options.global.useCSS){
			return;
		}
		if(this.paused){
			requestAnimationFrame(this.canvasDrawerWrapper);
			return;
		}
		var now=performance.now()|0, cmt, i, devicePixelRatio = window.devicePixelRatio, pausedTime = this.pausedTime,
		ctx = this.canvas.getContext('2d'),
		canvasWidth = this.width, canvasHeight = this.height,
		x, y;
		ctx.clearRect(0, 0, canvasWidth * devicePixelRatio, canvasHeight * devicePixelRatio);
		ctx.globalAlpha=this.options.global.autoOpacity ? this.options.global.autoOpacityVal : this.options.global.opacity;
		ctx.imageSmoothingEnabled = false;
		
		if(pausedTime!=0){
			this.runline.forEach(function(cmt){
				if(!cmt.textData)return;
				switch(cmt.mode){
					case 1:
						cmt.prev += pausedTime;
					break;
					case 4:
					case 5:
						cmt.removeTime += pausedTime;
					break;
				}
			})
			this.pausedTime = 0;
		}
		
		this.runline.forEach(function(cmt){
			if(!cmt.textData)return;
			switch(cmt.mode){
				case 1:
					//scroll
					cmt.rx += cmt.speed * ( now - cmt.prev ) / 1e3;
					cmt.prev = now;
				break;
			}
		});
		
		if(this.staticUpdate){
			canvasDrawStatic(this);
			this.staticUpdate=false;
		}
		
		canvasDrawScroll(this);
		//this.canvas.style.opacity = this.options.global.opacity;
		//this.canvas.getContext('2d').putImageData(ctx.getImageData(0, 0, this.canvas.width, this.canvas.height), 0, 0)
		requestAnimationFrame(this.canvasDrawerWrapper);
	};
	var prevMoving=false,ceil=Math.ceil,round=Math.round,colorGetter = function(color){
		var color = color.toString(16);
		while(color.length<6)
			color = '0'+color;
		return color;
		/*
		var r = (color >>> 16),
		g = (color >>> 8) & 0xff,
		b = color & 0xff;
		return [r,g,b];*/
	},ttlRecalc=function(cmt){
		if(cmt.speed){
			var runned = cmt.dur - cmt.ttl;
			cmt.dur = ( cmt.parent.width + cmt.width ) / cmt.speed * 1e3;
			cmt.ttl = cmt.dur - runned;
		}
	},commentCanvasDrawer = function(cmt){
		var commentCanvas = document.createElement('canvas'), commentCanvasCtx = commentCanvas.getContext('2d'), devicePixelRatio = window.devicePixelRatio;
		commentCanvasCtx.font = (cmt.size * devicePixelRatio) + 'px ' + font;
		commentCanvasCtx.imageSmoothingEnabled = false;
		cmt.width = ceil(commentCanvasCtx.measureText(cmt.text).width / devicePixelRatio)+2;
		cmt.height = ceil(cmt.size+3)+2;
		cmt.oriWidth = ceil(cmt.width * devicePixelRatio);
		cmt.oriHeight = ceil(cmt.height * devicePixelRatio);
		
		commentCanvas.width = cmt.oriWidth;
		commentCanvas.height = cmt.oriHeight;
		commentCanvasCtx.font = (cmt.size * devicePixelRatio) + 'px ' + font;
		commentCanvasCtx.lineWidth = round(1 * devicePixelRatio);
		commentCanvasCtx.strokeStyle = (cmt._color == 0) ? '#FFFFFF' : '#000000';
		commentCanvasCtx.textBaseline = 'bottom';
		commentCanvasCtx.textAlign = 'left';
		
		commentCanvasCtx.shadowBlur = round(2 * devicePixelRatio);
		commentCanvasCtx.shadowColor = (cmt._color == 0) ? '#FFFFFF' : '#000000';
		commentCanvasCtx.fillStyle = '#' + colorGetter(cmt.color);
		commentCanvasCtx.strokeText(cmt.text, 1, commentCanvas.height-1);
		commentCanvasCtx.fillText(cmt.text, 1, commentCanvas.height-1);
		
		if(cmt.border){
			commentCanvasCtx.lineWidth = round(2 * devicePixelRatio);
			commentCanvasCtx.strokeStyle = '#00ffff';
			commentCanvasCtx.shadowBlur = 0;
			commentCanvasCtx.strokeRect(0,0,commentCanvas.width,commentCanvas.height);
		}
		cmt.textData = commentCanvas;
	};
	CommentManager.prototype.getCommentFromPoint = function(x, y){
		var dmList=[],dx,dy,height=this.height;
		this.runline.forEach(function(i){
			dx=x-i.x;
			if(i.mode==4){
				dy=y-(height-i.y-i.height);
			}else
				dy=y-i.y;
			if(dx>=0&&dx<=i.width &&
					dy>=0&&dy<=i.height)
				dmList.push(i);
		});
		return dmList;
	};
	CommentManager.prototype.useCSS = function(state){
		this.options.global.useCSS = state;
		this.clear();
		if(!state){
			this.stage.style.opacity='';
			requestAnimationFrame(this.canvasDrawerWrapper);
		}
	};
	CommentManager.prototype.autoOpacity = function(state){
		this.options.global.autoOpacity = state;
	};
	CommentManager.prototype.sendAsync = function(data){
		if(data.mode === 8){
			console.log(data);
			if(this.scripting){
				console.log(this.scripting.eval(data.code));
			}
			return;
		}
		if(this.filter != null){
			data = this.filter.doModify(data);
			if(data == null || data === false) return;
		}
		
		//canvas break
		if(!this.options.global.useCSS && [1,4,5].indexOf(data.mode) != -1 ){
			var now = performance.now();
			var cmt = new CoreComment(this, data);
			cmt.dom = {style:{}};
			commentCanvasDrawer(cmt);
			if( data.mode == 1 || data.mode == 6){
				cmt.rx = 0;
				cmt.x = this.width;
				cmt.prev = now;
				cmt.speed = ( this.width + cmt.width ) / cmt.dur * 1e3;
			}else if ( data.mode == 4 || data.mode == 5 ){
				cmt.removeTime = now + cmt.dur;
			}
			switch(cmt.mode){
				default:
				case 1:{this.csa.scroll.add(cmt);}break;
				case 4:{this.csa.bottom.add(cmt);this.staticUpdate=true;}break;
				case 5:{this.csa.top.add(cmt);this.staticUpdate=true;}break;
			}
		}else{
			
			if(data.mode === 1 || data.mode === 2 || data.mode === 6){
				var cmt = new CSSScrollComment(this, data);
			}else{
				var cmt = new CoreComment(this, data);
			}
			switch(cmt.mode){
				case 1:cmt.align = 0;break;
				case 2:cmt.align = 2;break;
				case 4:cmt.align = 2;break;
				case 5:cmt.align = 0;break;
				case 6:cmt.align = 1;break;
			}
			cmt.init();
			this.stage.appendChild(cmt.dom);
			cmt.dom.transitionStartTime=(new Date).getTime();
			switch(cmt.mode){
				default:
				case 1:{this.csa.scroll.add(cmt);}break;
				case 2:{this.csa.scrollbtm.add(cmt);}break;
				case 4:{this.csa.bottom.add(cmt);}break;
				case 5:{this.csa.top.add(cmt);}break;
				case 6:{this.csa.reverse.add(cmt);}break;
				case 17:
				case 7:{
					if(data.rY !== 0 || data.rZ !== 0){
						/** TODO: revise when browser manufacturers make up their mind on Transform APIs **/
						cmt.dom.style.transform = getRotMatrix(data.rY, data.rZ);
						cmt.dom.style.webkitTransform = getRotMatrix(data.rY, data.rZ);
						cmt.dom.style.OTransform = getRotMatrix(data.rY, data.rZ);
						cmt.dom.style.MozTransform = getRotMatrix(data.rY, data.rZ);
						cmt.dom.style.MSTransform = getRotMatrix(data.rY, data.rZ);
					}
				}break;
			}
			cmt.y = cmt.y;
		}
		cmt.originalData=data;
		this.dispatchEvent("enterComment", cmt);
		this.runline.push(cmt);
	};
	CommentManager.prototype.finish = function(cmt){
		this.dispatchEvent("exitComment", cmt);
		try{
			this.stage.removeChild(cmt.dom);
		}catch(e){}
		var index = this.runline.indexOf(cmt);
		if(index >= 0){
			this.runline.splice(index, 1);
		}
		switch(cmt.mode){
			default:
			case 1:{this.csa.scroll.remove(cmt);}break;
			case 2:{this.csa.scrollbtm.remove(cmt);}break;
			case 4:{this.csa.bottom.remove(cmt);this.staticUpdate=true;}break;
			case 5:{this.csa.top.remove(cmt);this.staticUpdate=true;}break;
			case 6:{this.csa.reverse.remove(cmt);}break;
			case 7:break;
		}
		if(cmt.textData)
			cmt.textData = null;
	};
	CommentManager.prototype.resumeComment=function (){
		Array.prototype.slice.call(this.stage.children).forEach(function(a){
			a.classList.contains("cmt") &&
			a.classList.contains("paused") &&
			(
				a.style.transitionDuration=a.finalDuration+"ms",
				a.style.transform=a.finalTransform,
				a.transitionStartTime=(new Date).getTime(),
				a.classList.remove("paused")
			)
		})
	};
	CommentManager.prototype.pauseComment=function (){
		Array.prototype.slice.call(this.stage.children).forEach(function(a){
			a.classList.contains("cmt")&&
			!a.classList.contains("paused")&&
			(
				a.finalTransform=a.style.transform,
				a.style.transform=window.getComputedStyle(a).getPropertyValue("transform"),
				a.finalDuration=parseFloat(a.style.transitionDuration)-(new Date).getTime()+a.transitionStartTime,
				a.style.transitionDuration="10ms",
				a.classList.add("paused")
			)
		})
	};
	CommentManager.prototype.addEventListener = function(event, listener){
		if(typeof this._listeners[event] !== "undefined"){
			this._listeners[event].push(listener);
		}else{
			this._listeners[event] = [listener];
		}
	};
	CommentManager.prototype.dispatchEvent = function(event, data){
		if(typeof this._listeners[event] !== "undefined"){
			for(var i = 0; i < this._listeners[event].length; i++){
				try{
					this._listeners[event][i](data);
				}catch(e){
					console.err(e.stack);
				}
			}
		}
	};
	/** Static Functions **/
	CommentManager.prototype.onTimerEvent = function(timePassed,cmObj){
		for(var i= 0;i < cmObj.runline.length; i++){
			var cmt = cmObj.runline[i];
			if(cmt.hold){
				continue;
			}
			cmt.time(timePassed);
		}
	};
	return CommentManager;
})();
/*!
 *
 * ABPlayer-bilibili-ver
 * Copyright (c) 2014 Jim Chen (http://kanoha.org/), under the MIT license.
 *
 * bilibili-ver
 * @author zacyu
 *
 */
function isMobile() {
var check = false;
(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
return check; }
var ABP = {
	"version": "0.8.0",
	Strings:{
		statsPlayer:'播放器尺寸：',
		statsVideo:'视频分辨率：',
		statsBuffer:'可用缓冲：',
		statsBufferClip:'缓冲片段：',
		statsPresent:'期望帧率：',
		statsDrop:'丢弃帧率：',
		statsVideoCodec:'视频编码：',
		statsAudioCodec:'音频编码：',
		statsVideoBitrate:'视频码率：',
		statsAudioBitrate:'音频码率：',
		statsCurrentBitrate:'本段码率：',
		statsRealtimeBitrate:'实时码率：',
		overallBitrate:'总体码率：',
		statsDownloadSpeed:'下载速度：',
		
		sendSmall:"小字号",
		sendMid:"中字号",
		sendSize:'弹幕字号',
		sendMode:"弹幕模式",
		sendTop:"顶端渐隐",
		sendScroll:"滚动字幕",
		sendBottom:"底端渐隐",
		send:"发送",
		sendStyle:"弹幕样式",
		sendColor:"弹幕颜色",

		
		commentSpeed:"弹幕速度",
		commentScale:"弹幕比例",
		commentOpacity:"弹幕不透明度",
		commentBlock:"弹幕屏蔽列表",
		
		playSpeed:"播放速度",
		playSpeedReset:"还原正常速度",
		
		displayScaleD:"默认",
		displayScaleF:"全屏",
		
		shieldTypeText:'文字',
		shieldTypeUser:'用户',
		shieldTypeColor:'颜色',
		shieldTypeSetting:'设置',
		shieldAdd:'添加屏蔽……',
		shieldUseRegex:'启用正则',
		
		viewers:' 观众',
		comments:' 弹幕',
		commentTime:"时间",
		commentContent:"评论",
		commentDate:"发送日期",
		
		showStats:'显示统计信息',
		
		loadingMeta:'正在加载视频信息',
		switching:'正在切换',
		fetchURL:'正在获取视频地址',
		buffering:'正在缓冲',
		play:'播放',
		pause:'暂停',
		mute:'静音',
		unmute:'取消静音',
		fullScreen:"浏览器全屏",
		exitFullScreen:"退出全屏",
		webFull:"网页全屏",
		exitWebFull:"退出网页全屏",
		wideScreen:"宽屏模式",
		exitWideScreen:"退出宽屏",
		sendTooltip:"毁灭地喷射白光!da!",
		showComment:"显示弹幕",
		hideComment:"隐藏弹幕",
		loopOn:"洗脑循环 on",
		loopOff:"重新载入",
		usingCanvas:'正在使用Canvas',
		usingCSS:'正在使用CSS',
		useCSS:'使用CSS绘制弹幕',
		autoOpacityOn:'关闭自动不透明度',
		autoOpacityOff:'开启自动不透明度',
		
		copyComment:'复制弹幕',
		findComment:'定位弹幕',
		blockContent:'屏蔽内容“',
		blockUser:'屏蔽发送者',
		blockColor:'屏蔽颜色',
		blockColorWhite:'不能屏蔽白色',
		copyFail:'复制失败，浏览器不支持',
		
		blockUserEmpty:'没有屏蔽用户',
		blockColorEmpty:'没有屏蔽颜色'
	}
};

(function() {
	"use strict";
	if (!ABP) return;
	var $$ = jQuery,
	addEventListener='addEventListener',
	versionString='HTML5 Player ver.171229 based on ABPlayer-bilibili-ver',
	$ = function(e) {
		return document.getElementById(e);
	};
	var _ = function(type, props, children, callback) {
		var elem = null;
		if (type === "text") {
			return document.createTextNode(props);
		} else {
			elem = document.createElement(type);
		}
		for (var n in props) {
			if (n !== "style" && n !== "className") {
				elem.setAttribute(n, props[n]);
			} else if (n === "className") {
				elem.className = props[n];
			} else {
				for (var x in props.style) {
					elem.style[x] = props.style[x];
				}
			}
		}
		if (children) {
			for (var i = 0; i < children.length; i++) {
				if (children[i] != null)
					elem.appendChild(children[i]);
			}
		}
		if (callback && typeof callback === "function") {
			callback(elem);
		}
		return elem;
	};

	var findRow = function(node) {
		var i = 1;
		while (node = node.previousSibling) {
			if (node.nodeType === 1) {
				++i
			}
		}
		return i;
	}

	var findClosest = function(node, className) {
		for (; node; node = node.parentNode) {
			if (hasClass(node.parentNode, className)) {
				return node;
			}
		}
	}

	HTMLElement.prototype.tooltip = function(data) {
		this.tooltipData = data;
		this.dispatchEvent(new Event("updatetooltip"));
	};

	if (typeof HTMLElement.prototype.requestFullScreen == "undefined") {
		HTMLElement.prototype.requestFullScreen = function() {
			if (this.webkitRequestFullscreen) {
				this.webkitRequestFullscreen();
			} else if (this.mozRequestFullScreen) {
				this.mozRequestFullScreen();
			} else if (this.msRequestFullscreen) {
				this.msRequestFullscreen();
			}
		}
	}

	var videoProto = Object.keys(HTMLVideoElement.prototype);
	if (videoProto.indexOf("webkitDecodedFrameCount") != -1 && videoProto.indexOf("getVideoPlaybackQuality") == -1) {
		//Workaround for a fake videoPlaybackQuality
		HTMLVideoElement.prototype.getVideoPlaybackQuality = function () {
			return {
				totalVideoFrames: this.webkitDecodedFrameCount,
				droppedVideoFrames: this.webkitDroppedFrameCount
			};
		}
	}

	if (typeof document.isFullScreen == "undefined") {
		document.isFullScreen = function() {
			return document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenEnabled;
		}
	}

	if (typeof document.exitFullscreen == "undefined") {
		document.exitFullscreen = function() {
			if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (window.msExitFullscreen) {
				msExitFullscreen()
			}
		}
	}

	var pad = function(number, length) {
		length = length || 2;
		var str = '' + number;
		while (str.length < length) {
			str = '0' + str;
		}
		return str;
	}

	var htmlEscape = function(text) {
		return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	}

	var formatInt = function(source, length) {
		var strTemp = "";
		for (var i = 1; i <= length - (source + "").length; i++) {
			strTemp += "0";
		}
		return strTemp + source;
	}

	var formatDate = function(timestamp, shortFormat) {
		if (timestamp == 0) {
			return lang['oneDay'];
		}
		var date = new Date((parseInt(timestamp)) * 1000),
			year, month, day, hour, minute, second;
		year = String(date.getFullYear());
		month = String(date.getMonth() + 1);
		if (month.length == 1) month = "0" + month;
		day = String(date.getDate());
		if (day.length == 1) day = "0" + day;
		hour = String(date.getHours());
		if (hour.length == 1) hour = "0" + hour;
		minute = String(date.getMinutes());
		if (minute.length == 1) minute = "0" + minute;
		second = String(date.getSeconds());
		if (second.length == 1) second = "0" + second;
		if (shortFormat) return String(month + "-" + day + " " + hour + ":" + minute);
		return String(year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second);
	}

	var formatTime = function(time) {
		if (isNaN(time)) return '00:00';
		return formatInt(parseInt(time / 60), 2) + ':' + formatInt(parseInt(time % 60), 2);
	}

	var convertTime = function(formattedTime) {
		var timeParts = formattedTime.split(":"),
			total = 0;
		for (var i = 0; i < timeParts.length; i++) {
			total *= 60;
			var value = parseInt(timeParts[i]);
			if (isNaN(value) || value < 0) return false;
			total += value;
		}
		return total;
	}
	var hoverTooltip = function(elem, follow, yoffset) {
		if (!elem) return;
		elem[addEventListener]("mousemove", function(e) {
			var tooltip = $("ABP-Tooltip"),
				elemWidth = elem.clientWidth,
				elemHeight = elem.clientHeight,
				elemOffset = elem.getBoundingClientRect(),
				unitOffset = findClosest(elem, 'ABP-Unit').getBoundingClientRect(),
				elemTop = elemOffset.top - unitOffset.top,
				elemLeft = follow ? e.clientX - unitOffset.left : elemOffset.left - unitOffset.left,
				tooltipLeft = elemLeft,
				tooltipRect;
			if (tooltip == null) {
				tooltip = _("div", {
					"id": "ABP-Tooltip",
				}, [_("text", elem.tooltipData)]);
				tooltip.by = elem;
				findClosest(elem, 'ABP-Unit').appendChild(tooltip);
				tooltip.style["top"] = elemTop + elemHeight + 2 + "px";
				tooltip.style["left"] = elemLeft + elemWidth / 2 - tooltip.clientWidth / 2 + "px";
				tooltipLeft += elemWidth / 2 - tooltip.clientWidth / 2;
			}
			if (follow) {
				tooltip.style["left"] = elemLeft - tooltip.clientWidth / 2 + "px";
				tooltipLeft -= elemWidth / 2;
			}
			tooltipRect=tooltip.getBoundingClientRect();
			if(tooltipRect.left < unitOffset.left){
				tooltip.style.left='0px';
			}else if(tooltipRect.right > unitOffset.right){
				tooltip.style.left=unitOffset.width-tooltipRect.width+'px';
			}
			yoffset=yoffset||-6;
			if (yoffset) {
				tooltip.style["top"] = elemTop - tooltip.clientHeight + 2 + yoffset + "px";
			}
		});
		elem[addEventListener]("mouseout", function() {
			var tooltip = $("ABP-Tooltip");
			if (tooltip && tooltip.parentNode) {
				tooltip.parentNode.removeChild(tooltip);
			}
		});
		elem[addEventListener]("updatetooltip", function(e) {
			var tooltip = $("ABP-Tooltip");
			if (tooltip && tooltip.by == e.target) {
				tooltip.innerHTML = elem.tooltipData;
			}
		});
	}
	var addClass = function(elem, className) {
		if (elem == null) return;
		var oldClass = elem.className.split(" ");
		if (oldClass[0] == "") oldClass = [];
		if (oldClass.indexOf(className) < 0) {
			oldClass.push(className);
		}
		elem.className = oldClass.join(" ");
	};
	var hasClass = function(elem, className) {
		if (elem == null) return false;
		var oldClass = elem.className.split(" ");
		if (oldClass[0] == "") oldClass = [];
		return oldClass.indexOf(className) >= 0;
	}
	var removeClass = function(elem, className) {
		if (elem == null) return;
		var oldClass = elem.className.split(" ");
		if (oldClass[0] == "") oldClass = [];
		if (oldClass.indexOf(className) >= 0) {
			oldClass.splice(oldClass.indexOf(className), 1);
		}
		elem.className = oldClass.join(" ");
	};
	var buildFromDefaults = function(n, d) {
		var r = {};
		for (var i in d) {
			if (n && typeof n[i] !== "undefined")
				r[i] = n[i];
			else
				r[i] = d[i];
		}
		return r;
	}


	ABP.create = function(element, params) {
		var elem = element;
		if (!params) {
			params = {};
		}
		ABP.playerConfig = params.config ? params.config : {};
		params = buildFromDefaults(params, {
			"replaceMode": true,
			"width": 512,
			"height": 384,
			"src": ""
		});
		if (typeof element === "string") {
			elem = $(element);
		}
		// 'elem' is the parent container in which we create the player.
		if (!hasClass(elem, "ABP-Unit")) {
			// Assuming we are injecting
			var container = _("div", {
				"className": "ABP-Unit",
				theme:'YouTube',
				"style": {
					"width": params.width.toString().indexOf("%") >= 0 ? params.width : params.width + "px",
					"height": params.height.toString().indexOf("%") >= 0 ? params.height : params.height + "px"
				}
			});
			elem.appendChild(container);
		} else {
			container = elem;
		}
		// Create the innards if empty
		if (container.children.length > 0 && params.replaceMode) {
			container.innerHTML = "";
		}
		var playlist = [];
		var danmaku = [];
		if (typeof params.src === "string") {
			params.src = _("video", {
				"autobuffer": "true",
				"dataSetup": "{}",
			}, [
				_("source", {
					"src": params.src
				})
			]);
			playlist.push(params.src);
		} else if (params.src.hasOwnProperty("playlist")) {
			var data = params.src;
			var plist = data.playlist;
			for (var id = 0; id < plist.length; id++) {
				if (plist[id].hasOwnProperty("sources")) {
					var sources = [];
					for (var mime in plist[id]["sources"]) {
						sources.push(_("source", {
							"src": plist[id][mime],
							"type": mime
						}));
					}
					playlist.push(_("video", {
						"autobuffer": "true",
						"dataSetup": "{}",
					}, sources));
				} else if (plist[id].hasOwnProperty("video")) {
					playlist.push(plist[id]["video"]);
				} else {}
				danmaku.push(plist[id]["comments"]);
			}
		} else {
			playlist.push(params.src);
		}
		container.appendChild(_("div", {
			"className": "ABP-Player"
		}, [_("div", {
			"className": "ABP-Video",
			"tabindex": "10"
		}, [_('div',{id:'info-box',style:{opacity:1}},[
				_('div',{className:'text-wrapper'},[_('div',{},[_('text',ABP.Strings.loadingMeta)])]),
				_('div',{id:'dots'})
			]),
			_("div", {
				"className": "ABP-Container"
			}),playlist[0],_('div',{className:'Player-Stats'},[
				/*
				dimension
					player
					video
				buffer
				*flvjs
					mimeType
					audioCodec
					videoCodec
					fps
					videoBit
					audioBit
					currentBitrate
				bitrate
				*firefox
					frames
						decoded
						painted
						presented
						dropped
				*webkit
					frames
						decoded
						dropped
				*/
				_('div',{id:'player-dimension'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsPlayer)]),_('span')]),
				_('div',{id:'video-dimension'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsVideo)]),_('span')]),
				_('div',{id:'buffer-health'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsBuffer)]),_('span',{className:'stats-column',id:'buffer-health-column'}),_('span')]),
				
				_('br',{className:'flvjs'}),
				_('div',{className:'flvjs'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsVideoCodec)]),_('span')]),
				_('div',{className:'flvjs'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsAudioCodec)]),_('span')]),
				_('div',{className:'flvjs'},[_('span',{className:'stats_name'},[_('text','fps：')]),_('span')]),
				_('div',{className:'flvjs',title:'1 kbps = 1000 bps'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsVideoBitrate)]),_('span')]),
				_('div',{className:'flvjs',title:'1 kbps = 1000 bps'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsAudioBitrate)]),_('span')]),
				
				_('div',{className:'flvjs',title:'1 kbps = 1000 bps'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsRealtimeBitrate)]),_('span',{className:'stats-column',id:'realtime-bitrate-column',style:{verticalAlign:'top'}}),_('span')]),
				_('div',{className:'flvjs'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsDownloadSpeed)]),_('span',{className:'stats-column',id:'download-speed-column',style:{verticalAlign:'top'}}),_('span')]),
				
				_('br',{className:'hlsjs'}),
				_('div',{className:'hlsjs'},[_('span',{className:'stats_name'},[_('text','当前分片：')]),_('span',{style:{width:'180px',height:'5px',display:'inline-block',position:'relative',border:'solid #AAA 1px',borderRadius:'4px',verticalAlign:'middle',marginRight:'2px'}},[
					_('span',{id:'download-progress-hls',style:{position:'absolute',left:'2px',right:'2px',top:'1px',bottom:'1px',background:'#CCC',borderRadius:'3px',transition:'width .3s',width:0}})
				]),_('span')]),
				_('div',{className:'hlsjs'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsDownloadSpeed)]),_('span',{className:'stats-column',id:'download-speed-hls-column',style:{verticalAlign:'top'}}),_('span')]),
				_('br'),

				_('div',{style:{position:'relative'}},[
				_('span',{className:'stats_name'},[_('text',ABP.Strings.statsBufferClip)]),_('span',{id:'buffer-clips'},[
					_('span'),
					_('span',{},[
						_('div',{style:{width:'1px',height:'400%',top:'-150%',position:'absolute',background:'#FFF',left:0}})
					])
				]),_('pre',{style:{position:'absolute',margin:0,left:'210px',width:'90px',fontFamily:'inherit'}})]),
				
				_('div',{id:'canvas-fps'},[_('span',{className:'stats_name'},[_('text','Canvas fps：')]),_('span')]),
				
				_('div',{className:'videoQuality'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsPresent)]), ,_('span',{className:'stats-column',id:'playback-fps-column'}),_('span')]),
				_('div',{className:'videoQuality'},[_('span',{className:'stats_name'},[_('text',ABP.Strings.statsDrop)]), ,_('span',{className:'stats-column',id:'drop-fps-column'}),_('span')]),
				
				_('br'),
				_('div',{style:{fontSize:'11px'}},[_('text',versionString)]),
				_('div',{style:{fontSize:'11px'}},[_('text','2017©esterTion')]),
				_('div',{id:'stats-close'},[_('text','×')])
			])
		]), _("div", {
			"className": "ABP-FullScreenProgress"
		}), _("div", {
			"className": "ABP-Bottom",
		}, [_("div", {
			"className": "ABP-Bottom-Extend"
		}),_('div',{className:'ABP-Bottom-Wrapper'},[_("div", {
			"className": "ABP-Text",
		}, [
			_("div", {
				"className": "ABP-CommentStyle"
			}, [
				_("div", {
					"className": "button-group ABP-Comment-FontGroup"
				}, [_("div", {
					"className": "button ABP-Comment-Font icon-font-style"
				}), _("div", {
					"className": "ABP-Comment-FontOption"
				}, [
					_("p", {
						"className": "style-title"
					}, [_("text", ABP.Strings.sendSize)]),
					_("div", {
						"className": "style-select",
						"name": "commentFontSize"
					}, [_("div", {
						"className": "style-option",
						"value": 18
					}, [_("text", ABP.Strings.sendSmall)]), _("div", {
						"className": "style-option on",
						"value": 25
					}, [_("text", ABP.Strings.sendMid)])]),
					_("p", {
						"className": "style-title"
					}, [_("text", ABP.Strings.sendMode)]),
					_("div", {
						"className": "style-select",
						"name": "commentMode"
					}, [_("div", {
						"className": "style-option",
						"value": 5
					}, [_("text", ABP.Strings.sendTop)]), _("div", {
						"className": "style-option on",
						"value": 1
					}, [_("text", ABP.Strings.sendScroll)]), _("div", {
						"className": "style-option",
						"value": 4
					}, [_("text", ABP.Strings.sendBottom)])])
				])]),
				_("div", {
					"className": "button-group ABP-Comment-ColorGroup"
				}, [_("div", {
					"className": "ABP-Comment-Color-Display"
				}), _("div", {
					"className": "button ABP-Comment-Color icon-color-mode"
				}), _("div", {
					"className": "ABP-Comment-ColorOption"
				}, [_("div", {
					"className": "ABP-Comment-ColorPicker"
				})])]),
			]),
			_('form',{},[_("input", {
				"className": "ABP-Comment-Input",
			})]),
			_("div", {
				"className": "ABP-Comment-Send"
			}, [
				_("text", ABP.Strings.send)
			])
		]), _("div", {
			"className": "ABP-Control"
		}, [
			_("div", {
				"className": "button ABP-Play icon-play"
			}),
			_("div", {
				"className": "progress-bar"
			}, [
				_("div", {
					"className": "bar"
				}, [
					_("div", {
						"className": "load"
					}),
					_("div", {
						"className": "dark"
					})
				]),
			]),
			_("div", {
				"className": "time-label"
			}, [_("text", "00:00")]),
			_("div", {
				"className": "button ABP-Volume icon-volume-high"
			}),
			_("div", {
				"className": "volume-bar"
			}, [
				_("div", {
					"className": "bar"
				}, [
					_("div", {
						"className": "load"
					})
				]),
			]),
			_("div", {
				"className": "button-group ABP-CommentGroup"
			}, [_("div", {
				"className": "button ABP-CommentShow icon-comment on"
			}), _("div", {
				"className": "ABP-CommentOption"
			}, [_('p', {
				className:'label'
			}, [_('text',ABP.Strings.useCSS), _("div", {
				"className": "prop-checkbox"
			})]), _("p", {
				"className": "label"
			}, [_("text", ABP.Strings.commentSpeed)]), _("div", {
				"className": "speed-bar"
			}, [
				_("div", {
					"className": "bar"
				}, [
					_("div", {
						"className": "load"
					})
				]),
			]), _("p", {
				"className": "label"
			}, [_("text", ABP.Strings.commentScale)]), _("div", {
				"className": "scale-bar"
			}, [
				_("div", {
					"className": "bar"
				}, [
					_("div", {
						"className": "load"
					})
				]),
			]), _("p", {
				"className": "label"
			}, [_("text", ABP.Strings.commentOpacity)]), _("div", {
				"className": "opacity-bar",
				style:{
					width:'calc(100% - 25px)'
				}
			}, [
				_("div", {
					"className": "bar"
				}, [
					_("div", {
						"className": "load"
					})
				]),
			]), _("div", {
				"className": "prop-checkbox",
				style:{
					top:'121px'
				}
			}), _("div", {
				"className": "shield-enrty"
			}, [
				_("text", ABP.Strings.commentBlock),
			])])]), _("div", {
				"className": "button-group ABP-PlaySpeedGroup"
			},[_("div", {
				"className": "button ABP-Loop icon-loop"
			})]), _("div", {
				"className": "button ABP-WideScreen icon-tv"
			}),
			_("div", {
				"className": "button-group ABP-FullScreenGroup"
			}, [_("div", {
				"className": "button ABP-FullScreen icon-screen-full"
			}), _("div", {
				"className": "button ABP-Web-FullScreen icon-screen"
			})])
		]),]),_("div", {
			"className": "BiliPlus-Scale-Menu"
		}, [_("div",{
			"className": "Video-Defination"
		}),_("div",{
			"className": "Video-Scale"
		},[_("div", {
				'changeTo':'default',
				'className':'on'
			}, [_("text", ABP.Strings.displayScaleD)]),
			_("div", {
				'changeTo':'16_9'
			}, [_("text", "16:9")]),
			_("div", {
				'changeTo':'4_3'
			}, [_("text", "4:3")]),
			_("div", {
				'changeTo':'full'
			}, [_("text", ABP.Strings.displayScaleF)])
		])
		])])]));
		container.appendChild(_('div',{className:'shield hidden'},[
			_('div',{
				className:'shield_top'
			},[_('text',ABP.Strings.commentBlock),_('span',{className:'close'})]),
			_('div',{className:'shield_tabs'},[
				_('div',{className:'shield_tab on'},[_('div',{},[_('text',ABP.Strings.shieldTypeText)])]),
				_('div',{className:'shield_tab'},[_('div',{},[_('text',ABP.Strings.shieldTypeUser)])]),
				_('div',{className:'shield_tab'},[_('div',{},[_('text',ABP.Strings.shieldTypeColor)])]),
				_('div',{className:'shield_tab'},[_('div',{},[_('text',ABP.Strings.shieldTypeSetting)])])
			]),
			_('div',{className:'shield_tab_slash'}),
			_('div',{className:'shield_body'},[
				_('div',{className:'shield_body_wrapper'},[
					_('div',{className:'shield_tab_body'},[
						_('div',{id:'shield_text'}),
						_('div',{className:'shield_item'},[
							_('input',{className:'new',type:'text',placeholder:ABP.Strings.shieldAdd}),
							_('div',{className:'add'})
						]),
					]),
					_('div',{className:'shield_tab_body'},[
						_('div',{id:'shield_user'})
					]),
					_('div',{className:'shield_tab_body'},[
						_('div',{id:'shield_color'})
					]),
					_('div',{className:'shield_tab_body'},[
						_('div',{className:'shield_toggle',id:'useReg'},[_('text',ABP.Strings.shieldUseRegex)])
					])
				])
			])
		]))
		container.appendChild(_("div", {
			"className": "ABP-Comment-List"
		}, [
			_('div',{
				className:'ABP-Comment-List-Count'
			},[
				_('div',{
					style:{
						position:'absolute',
						right:'200px'
					}
				},[_('span',{id:'viewer',style:{fontWeight:'bold'}},[_('text','--')]),_('text',ABP.Strings.viewers)]),
				_('div',{
					style:{
						position:'absolute',
						right:'20px'
					}
				},[_('span',{id:'danmaku',style:{fontWeight:'bold'}},[_('text','--')]),_('text',ABP.Strings.comments)]),
			]),
			_("div", {
				"className": "ABP-Comment-List-Title"
			}, [_("div", {
				"className": "cmt-time",
				"item": "time"
			}, [_("text", ABP.Strings.commentTime)]), _("div", {
				"className": "cmt-content",
				"item": "content"
			}, [_("text", ABP.Strings.commentContent)]), _("div", {
				"className": "cmt-date",
				"item": "date"
			}, [_("text", ABP.Strings.commentDate)])]), _("div", {
				"className": "ABP-Comment-List-Container"
			}, [_("ul", {
				"className": "ABP-Comment-List-Container-Inner"
			})])
		]));
		container.appendChild(_('div',{className:'Context-Menu'},[
			_('div',{className:'Context-Menu-Background'}),
			_('div',{className:'Context-Menu-Body'},[
				_('div',{id:'Player-Stats-Toggle'},[_('text',ABP.Strings.showStats)]),
				_('div',{id:'Player-Speed-Control',className:'dm'},[_('div',{className:'content'},[_('text',ABP.Strings.playSpeed)]),_('div',{className:'dmMenu',style:{top:'-37px'}},[
					_('div',{'data-speed':0.5},[_('text',0.5)]),
					_('div',{'data-speed':1},[_('text',1)]),
					_('div',{'data-speed':1.25},[_('text',1.25)]),
					_('div',{'data-speed':1.5},[_('text',1.5)]),
					_('div',{'data-speed':2},[_('text',2)])
				])]),
				_('div',{className:'about'},[_('text',versionString)])
			])
		]));
		var bind = ABP.bind(container);
		if (playlist.length > 0) {
			var currentVideo = playlist[0];
			bind.gotoNext = function() {
				var index = playlist.indexOf(currentVideo) + 1;
				if (index < playlist.length) {
					currentVideo = playlist[index];
					currentVideo.style.display = "";
					var container = bind.video.parentNode;
					container.removeChild(bind.video);
					container.appendChild(currentVideo);
					bind.video.style.display = "none";
					bind.video = currentVideo;
					bind.swapVideo(currentVideo);
					currentVideo[addEventListener]("ended", function() {
						bind.gotoNext();
					});
				}
			}
			currentVideo[addEventListener]("ended", function() {
				bind.gotoNext();
			});
		}
		return bind;
	}
	var BiliBili_midcrc=function(){
		var CRCPOLYNOMIAL = 0xEDB88320,
		crctable=new Array(256),
		create_table=function(){
			var crcreg,
			i,j;
			for (i = 0; i < 256; ++i)
			{
				crcreg = i;
				for (j = 0; j < 8; ++j)
				{
					crcreg = (crcreg & 1) != 0 ? CRCPOLYNOMIAL ^ (crcreg >>> 1) : crcreg >>> 1;
				}
				crctable[i] = crcreg;
			}
		},
		crc32=function(input,returnIndex){
			var crcstart = 0xFFFFFFFF, len = input.length, index;
			for(var i=0;i<len;++i){
				index = (crcstart ^ input.charCodeAt(i)) & 0xff;
				crcstart = (crcstart >>> 8) ^ crctable[index];
			}
			return returnIndex?index:crcstart;
		},
		getcrcindex=function(t){
			for(var i=0;i<256;i++){
				if(crctable[i] >>> 24 == t)
					return i;
			}
			return -1;
		},
		deepCheckData='',
		deepCheck=function(i,index){
			var tc=0x00,str='',
			hash=crc32(i.toString(),!1);
			tc = hash & 0xff ^ index[2];
			if (!(tc <= 57 && tc >= 48))
				return 0;
			str+=tc-48;
			hash = crctable[index[2]] ^ (hash >>> 8);
			tc = hash & 0xff ^ index[1];
			if (!(tc <= 57 && tc >= 48))
				return 0;
			str+=tc-48;
			hash = crctable[index[1]] ^ (hash >>> 8);
			tc = hash & 0xff ^ index[0];
			if (!(tc <= 57 && tc >= 48))
				return 0;
			str+=tc-48;
			hash = crctable[index[0]] ^ (hash >>> 8);
			deepCheckData=str;
			return 1;
		};
		create_table();
		var index=new Array(4);
		return function(input){
			var ht=parseInt(input,16)^0xffffffff,
			snum,i,lastindex;
			for(i=1;i<1001;i++){
				if(ht==crc32(i.toString(),!1))
					return i;
			}
			for(i=3;i>=0;i--){
				index[3-i]=getcrcindex( ht >>> (i*8) );
				snum=crctable[index[3-i]];
				ht^=snum>>>((3-i)*8);
			}
			for(i=0;i<1e5; i++){
				lastindex = crc32(i.toString(),!0);
				if(lastindex == index[3]){
					if(deepCheck(i,index))
						break;
				}
			}
			return (i==1e5)?-1:(i+''+deepCheckData);
		}
	},
	getBuffer=function(video){
		for(var s,e,i=0,currentTime=video.currentTime;i<video.buffered.length;i++){
			if( currentTime>=video.buffered.start(i) && currentTime<=video.buffered.end(i) ){
				s = video.buffered.start(i);
				e = video.buffered.end(i);
				break;
			}
		}
		if(i==video.buffered.length)
			return {start:0,end:0,delta:0};
		return {
			start:s,
			end:e,
			delta:e-currentTime
		}
	};
	window.crc_engine=new BiliBili_midcrc();

	ABP.bind = function(playerUnit, state) {
		var ABPInst = {
			playerUnit: playerUnit,
			btnPlay: null,
			barTime: null,
			barFullScreenTime: null,
			barLoad: null,
			barTimeHitArea: null,
			barVolume: null,
			barVolumeHitArea: null,
			barOpacity: null,
			barOpacityHitArea: null,
			barScale: null,
			barScaleHitArea: null,
			barSpeed: null,
			barSpeedHitArea: null,
			btnFont: null,
			btnColor: null,
			btnSend: null,
			controlBar: null,
			timeLabel: null,
			timeJump: null,
			divComment: null,
			btnWide: null,
			btnFull: null,
			btnWebFull: null,
			btnDm: null,
			btnLoop: null,
			btnProp: null,
			btnAutoOpacity: null,
			videoDiv: null,
			btnVolume: null,
			video: null,
			txtText: null,
			commentColor: 'ffffff',
			commentFontSize: 25,
			commentMode: 1,
			displayColor: null,
			cmManager: null,
			commentList: null,
			commentListContainer: null,
			lastSelectedComment: null,
			commentCoolDown: 10000,
			commentScale: ABP.playerConfig.scale ? ABP.playerConfig.scale : 1,
			commentSpeed: ABP.playerConfig.speed ? ABP.playerConfig.speed : 1,
			proportionalScale: ABP.playerConfig.prop,
			defaults: {
				w: 0,
				h: 0
			},
			state: buildFromDefaults(state, {
				fullscreen: false,
				commentVisible: true,
				allowRescale: false,
				autosize: false,
				widescreen: false
			}),
			createPopup: function(text, delay) {
				if (playerUnit.hasPopup === true)
					return false;
				var p = _("div", {
					"className": "ABP-Popup"
				}, [_("text", text)]);
				p.remove = function() {
					if (p.isRemoved) return;
					p.isRemoved = true;
					playerUnit.removeChild(p);
					playerUnit.hasPopup = false;
				};
				playerUnit.appendChild(p);
				playerUnit.hasPopup = true;
				if (typeof delay === "number") {
					delay = 5000;
				}
				setTimeout(function() {
					p.remove();
				}, delay);
				return p;
			},
			removePopup: function() {
				var pops = playerUnit.getElementsByClassName("ABP-Popup");
				for (var i = 0; i < pops.length; i++) {
					if (pops[i].remove != null) {
						pops[i].remove();
					} else {
						pops[i].parentNode.removeChild(pops[i]);
					}
				}
				playerUnit.hasPopup = false;
			},
			loadCommentList: function(sort, order) {
				order = order == "asc" ? -1 : 1;
				var keysSorted = Object.keys(ABPInst.commentList).sort(function(a, b) {
					if (ABPInst.commentList[a][sort] < ABPInst.commentList[b][sort]) return order;
					if (ABPInst.commentList[a][sort] > ABPInst.commentList[b][sort]) return -order;
					return 0;
				});
				ABPInst.commentObjArray = [];
				for (i in keysSorted) {
					var key = keysSorted[i];
					var comment = ABPInst.commentList[key];
					if (comment && comment.time) {
						var commentObj = _("li", {}),
							commentObjTime = _("span", {
								"className": "cmt-time"
							}, [_("text", formatTime(comment.time / 1000))]),
							commentObjContent = _("span", {
								"className": "cmt-content"
							}, [_("text", comment.content)]),
							commentObjDate = _("span", {
								"className": "cmt-date"
							}, [_("text", formatDate(comment.date, true))]);
						hoverTooltip(commentObjContent, false, 36);
						hoverTooltip(commentObjDate, false, 18);
						commentObjContent.tooltip(comment.content);
						commentObjDate.tooltip(formatDate(comment.date));
						commentObj.appendChild(commentObjTime);
						commentObj.appendChild(commentObjContent);
						commentObj.appendChild(commentObjDate);
						commentObj.data = comment;
						commentObj.originalData=danmaku;
						if(comment.mode==8){
							commentObj.style.background='#ffe100';
						}else if(comment.pool!=0){
							commentObj.style.background='#20ff20';
						}
						commentObj[addEventListener]("dblclick", function(e) {
							ABPInst.video.currentTime = this.data.time / 1000;
							updateTime(video.currentTime);
						});
						ABPInst.commentObjArray.push(commentObj);
					}
				}
				ABPInst.commentListContainer.style.height = ABPInst.commentObjArray.length * 24 + "px";
				ABPInst.renderCommentList();
				ABPInst.playerUnit.querySelector('.ABP-Comment-List-Count span#danmaku').innerHTML=ABPInst.commentObjArray.length;
			},
			renderCommentList: function() {
				var offset = ABPInst.commentListContainer.parentElement.scrollTop,
					firstIndex = parseInt(offset / 24);
				ABPInst.commentListContainer.innerHTML = "";
				for (var i = firstIndex; i <= firstIndex + 40; i++) {
					if (typeof ABPInst.commentObjArray[i] !== "undefined") {
						if (i == firstIndex && i > 0) {
							var commentObj = ABPInst.commentObjArray[i].cloneNode(true),
								commentObjContent = commentObj.getElementsByClassName("cmt-content")[0],
								commentObjDate = commentObj.getElementsByClassName("cmt-date")[0];
							commentObj[addEventListener]("dblclick", function(e) {
								ABPInst.video.currentTime = ABPInst.commentObjArray[i].data.time / 1000;
								updateTime(video.currentTime);
							});
							hoverTooltip(commentObjContent, false, 36);
							hoverTooltip(commentObjDate, false, 18);
							commentObjContent.tooltip(ABPInst.commentObjArray[i].data.content);
							commentObjDate.tooltip(formatDate(ABPInst.commentObjArray[i].data.date));
							commentObj.style.paddingTop = 24 * firstIndex + "px";
						} else {
							var commentObj = ABPInst.commentObjArray[i];
						}
						if(ABPInst.commentObjArray[i].data.originalData.isBlocked){
							ABPInst.commentObjArray[i].childNodes[0].className='cmt-time blocked';
						}else{
							ABPInst.commentObjArray[i].childNodes[0].className='cmt-time';
						}
						ABPInst.commentListContainer.appendChild(commentObj);
					} else {
						break;
					}
				}
				ABPInst.commentListContainer.parentElement.scrollTop = offset;
			},
			commentCallback: function(data) {
				if (data.result) {
					ABPInst.commentList[data.id] = ABPInst.commentList[data.tmp_id];
					delete ABPInst.commentList[data.tmp_id];
				} else {
					delete ABPInst.commentList[data.tmp_id];
					ABPInst.createPopup(data.error, 5000);
				}
			},
			swapVideo: null
		};
		var saveSetting=function(k,v){
			var settings=localStorage.html5Settings||'{}';
			settings=JSON.parse(settings);
			settings[k]=v;
			localStorage.html5Settings=JSON.stringify(settings);
		}
		saveSetting.scale=function(e){
			saveSetting('scale',ABPInst.commentScale);
		}
		saveSetting.opacity=function(e){
			saveSetting('opacity',ABPInst.cmManager.options.global.opacity);
		}
		saveSetting.speed=function(e){
			saveSetting('speed',ABPInst.commentSpeed);
		}
		saveSetting.commentVisible=function(e){
			saveSetting('commentVisible',ABPInst.cmManager.display);
		}
		saveSetting.useCSS=function(e){
			saveSetting('useCSS',ABPInst.cmManager.options.global.useCSS);
		}
		saveSetting.autoOpacity=function(e){
			saveSetting('autoOpacity',ABPInst.cmManager.options.global.autoOpacity);
		}
		ABPInst.swapVideo = function(video) {
			var bufferListener=function() {
				if (!dragging) {
					updateTime(video.currentTime);
					try {
						ABPInst.barLoad.style.width = "100%";
					} catch (err) {
						return;
					}
				}
			}
			video[addEventListener]("timeupdate", bufferListener);
			video[addEventListener]("ended", function() {
				ABPInst.btnPlay.className = "button ABP-Play icon-play";
				ABPInst.barTime.style.width = "0%";
				ABPInst.barFullScreenTime.style.width = "0%";
			});
			video[addEventListener]("progress", bufferListener);
			/*
			video[addEventListener]("loadedmetadata", function() {
				if (this.buffered != null) {
					try {
						var s = this.buffered.start(0);
						var e = this.buffered.end(0);
					} catch (err) {
						return;
					}
					var dur = this.duration;
					var perc = (e / dur) * 100;
					ABPInst.barLoad.style.width = perc + "%";
				}
			});
			*/
			video.isBound = true;
			var lastPosition = 0,triedLoadScripting=false;
			if (ABPInst.cmManager) {
				ABPInst.cmManager[addEventListener]("load", function() {
					ABPInst.commentList = {};
					for (i in ABPInst.cmManager.timeline) {
						var danmaku = ABPInst.cmManager.timeline[i];
						if(danmaku.mode==8 && !triedLoadScripting){
							triedLoadScripting=true;
							setTimeout(function(){
								var bscripter = new CCLScripting("/js/CommentCoreLibraryScripting.min.js");
								ABPInst.cmManager.scripting = bscripter.getSandbox(ABPInst.divComment,ABPInst.video);
							},0)
						}
						if (danmaku.dbid && danmaku.stime) {
							ABPInst.commentList[danmaku.dbid] = {
								"date": danmaku.date,
								"time": danmaku.stime,
								"mode": danmaku.mode,
								"user": danmaku.hash,
								"pool": danmaku.pool,
								"content": danmaku.text||danmaku.code,
								"originalData":danmaku
							}
						}
					}
					ABPInst.loadCommentList("date", "asc");
					ABPInst.commentListContainer.parentElement[addEventListener]("scroll", ABPInst.renderCommentList);
				});
				ABPInst.cmManager.setBounds = function() {
					if (playerUnit.offsetHeight <= 300 || playerUnit.offsetWidth <= 700) {
						addClass(playerUnit, "ABP-Mini");
					} else {
						removeClass(playerUnit, "ABP-Mini");
					}
					var actualWidth = ABPInst.videoDiv.offsetWidth,
						actualHeight = ABPInst.videoDiv.offsetHeight,
						scale = ABPInst.proportionalScale ? actualHeight / 493 * ABPInst.commentScale : ABPInst.commentScale;
					this.width = actualWidth/* / scale*/;
					this.height = actualHeight/* / scale*/;
					this.options.global.scale = this.width / 680 / ABPInst.commentSpeed/* / ABPInst.video.playbackRate*/;
					this.dispatchEvent("resize");
					for (var a in this.csa) this.csa[a].setBounds(this.width, this.height);
					this.stage.style.width = this.width + "px";
					this.stage.style.height = this.height + "px";
					this.stage.style.perspective = this.width * Math.tan(40 * Math.PI / 180) / 2 + "px";
					this.stage.style.webkitPerspective = this.width * Math.tan(40 * Math.PI / 180) / 2 + "px";
					//this.stage.style.zoom = scale;
					playerUnit.querySelector('.BiliPlus-Scale-Menu .Video-Scale div.on').click();
					this.canvasResize();
				}
				ABPInst.cmManager.setBounds();
				ABPInst.cmManager.clear();
				//ABPInst.video[addEventListener]('loadedmetadata',function(){;isFirst=true;})
				var lastCheckTime = 0,isEnded=false,isLooping=false,loadingNew=false,
				autoPlay=function(){
					loadingNew=false;
					video.removeEventListener('canplay',autoPlay);
					if(video.paused)
						ABPInst.btnPlay.click();
				},
				buffering=function(){
					var rs=video.readyState,div=document.getElementById('info-box');
					if(video.ended)
						return;
					switch(rs){
						case 1:
							if(isMobile() && video.paused){
								ABPInst.createPopup('请点击播放器开始播放',3e3);
							}
						case 2:
							if(div.style.opacity==0){
								div.style.opacity=1;
							}
							if(!dots.running)
								dots.runTimer();
							try{
								var buffer=getBuffer(video);
								div.childNodes[0].childNodes[0].innerHTML=ABP.Strings.buffering+' '+Math.floor( (buffer.delta)*100 )/100+'s';
							}catch(e){
								div.childNodes[0].childNodes[0].innerHTML=ABP.Strings.buffering;
							}
						break;
						case 3:
						case 4:
							if(div.style.opacity==1){
								div.style.opacity=0;
								dots.stopTimer();
							}
						break;
					}
				}
				video[addEventListener]('autoplay',function(){
					video[addEventListener]('canplay',autoPlay);
				});
				video[addEventListener]('loop',function(){isLooping=video.loop});
				video[addEventListener]('canplay',autoPlay);
				video[addEventListener]('canplay',buffering);
				video[addEventListener]('waiting',buffering);
				video[addEventListener]('progress',buffering);
				video[addEventListener]("progress", function() {
					if (lastPosition == video.currentTime && isPlaying && new Date().getTime() - lastCheckTime >= 100) {
						video.hasStalled = true;
					} else if (lastPosition != video.currentTime) {
						lastPosition = video.currentTime;
					}
					lastCheckTime = new Date().getTime();
				});
				if (window) {
					window[addEventListener]("resize", function() {
						ABPInst.cmManager.setBounds();
					});
				}
				video[addEventListener]("timeupdate", function() {
					if (ABPInst.cmManager.display === false) return;
					if (video.hasStalled) {
						video.hasStalled = false;
					}
					ABPInst.cmManager.time(Math.floor(video.currentTime * 1000));
				});
				video[addEventListener]("ratechange", function() {
					if(this.playbackRate!=1){
						ABPInst.createPopup('检测到播放速度改变，10秒后恢复',3e3);
						setTimeout(function(){video.playbackRate=1;ABPInst.createPopup('播放速度已恢复',1e3);},1e4);
					}
				});
				var isPlaying = false;
				video[addEventListener]("pause", function() {
					isPlaying = false;
				});
				video[addEventListener]("waiting", function() {
					isPlaying = false;
				});
				video[addEventListener]("playing", function() {
					isPlaying = true;
				});
			}
		}
		if (playerUnit === null || playerUnit.getElementsByClassName === null) return;
		ABPInst.defaults.w = playerUnit.offsetWidth;
		ABPInst.defaults.h = playerUnit.offsetHeight;
		var _v = playerUnit.getElementsByClassName("ABP-Video");
		if (_v.length <= 0) return;
		var video = null;
		ABPInst.videoDiv = _v[0];
		for (var i in _v[0].children) {
			if (_v[0].children[i].tagName != null &&
				_v[0].children[i].tagName.toUpperCase() === "VIDEO") {
				video = _v[0].children[i];
				break;
			}
		}
		var cmtc = _v[0].getElementsByClassName("ABP-Container");
		if (cmtc.length > 0)
			ABPInst.divComment = cmtc[0];
		if (video === null) return;
		ABPInst.video = video;
		ABPInst.video.seek=function(t){this.currentTime=parseFloat(t)/1000;};
		/** Bind the Play Button **/
		var _p = playerUnit.getElementsByClassName("ABP-Play");
		if (_p.length <= 0) return;
		ABPInst.btnPlay = _p[0];
		ABPInst.btnPlay.tooltip(ABP.Strings.play);
		hoverTooltip(ABPInst.btnPlay);
		/** Bind the Loading Progress Bar **/
		var pbar = playerUnit.getElementsByClassName("progress-bar");
		if (pbar.length <= 0) return;
		var pbars = pbar[0].getElementsByClassName("bar");
		ABPInst.barTimeHitArea = pbars[0];
		ABPInst.barLoad = pbars[0].getElementsByClassName("load")[0];
		ABPInst.barTime = pbars[0].getElementsByClassName("dark")[0];
		/** Bind the Fullscreen Progress Bar **/
		var fspbar=playerUnit.getElementsByClassName("ABP-FullScreenProgress");
		if (fspbar.length <= 0) return;
		ABPInst.barFullScreenTime = fspbar[0];
		/** Bind the Time Label **/
		var _tl = playerUnit.getElementsByClassName("time-label");
		if (_tl.length <= 0) return;
		ABPInst.timeLabel = _tl[0];
		/** Bind the Volume button **/
		var vlmbtn = playerUnit.getElementsByClassName("ABP-Volume");
		if (vlmbtn.length <= 0) return;
		ABPInst.btnVolume = vlmbtn[0];
		ABPInst.btnVolume.tooltip(ABP.Strings.mute);
		hoverTooltip(ABPInst.btnVolume);
		/** Bind the Volume Bar **/
		var vbar = playerUnit.getElementsByClassName("volume-bar");
		if (vbar.length <= 0) return;
		var vbars = vbar[0].getElementsByClassName("bar");
		ABPInst.barVolumeHitArea = vbars[0];
		ABPInst.barVolume = vbars[0].getElementsByClassName("load")[0];
		/** Bind the Opacity Bar **/
		var obar = playerUnit.getElementsByClassName("opacity-bar");
		if (obar.length <= 0) return;
		var obar = obar[0].getElementsByClassName("bar");
		ABPInst.barOpacityHitArea = obar[0];
		ABPInst.barOpacity = obar[0].getElementsByClassName("load")[0];
		/** Bind the Scale Bar **/
		var sbar = playerUnit.getElementsByClassName("scale-bar");
		if (sbar.length <= 0) return;
		var sbar = sbar[0].getElementsByClassName("bar");
		ABPInst.barScaleHitArea = sbar[0];
		ABPInst.barScale = sbar[0].getElementsByClassName("load")[0];
		/** Bind the Speed Bar **/
		var spbar = playerUnit.getElementsByClassName("speed-bar");
		if (spbar.length <= 0) return;
		var spbar = spbar[0].getElementsByClassName("bar");
		ABPInst.barSpeedHitArea = spbar[0];
		ABPInst.barSpeed = spbar[0].getElementsByClassName("load")[0];
		/** Bind the Proportional Scale checkbox **/
		var pcheck = playerUnit.getElementsByClassName("prop-checkbox");
		if (pcheck.length <= 0) return;
		ABPInst.btnAutoOpacity = pcheck[1];
		ABPInst.btnAutoOpacity.tooltip(ABP.Strings.autoOpacityOn)
		hoverTooltip(ABPInst.btnAutoOpacity);
		ABPInst.btnProp = pcheck[0];
		ABPInst.btnProp.tooltip(ABP.Strings.usingCanvas);
		hoverTooltip(ABPInst.btnProp);
		/** Bind the FullScreen button **/
		var fbtn = playerUnit.getElementsByClassName("ABP-FullScreen");
		if (fbtn.length <= 0) return;
		ABPInst.btnFull = fbtn[0];
		ABPInst.btnFull.tooltip(ABP.Strings.fullScreen);
		hoverTooltip(ABPInst.btnFull);
		/** Bind the WebFullScreen button **/
		var wfbtn = playerUnit.getElementsByClassName("ABP-Web-FullScreen");
		if (wfbtn.length <= 0) return;
		ABPInst.btnWebFull = wfbtn[0];
		ABPInst.btnWebFull.tooltip(ABP.Strings.webFull);
		hoverTooltip(ABPInst.btnWebFull);
		/** Bind the WideScreen button **/
		var wsbtn = playerUnit.getElementsByClassName("ABP-WideScreen");
		if (wsbtn.length <= 0) return;
		ABPInst.btnWide = wsbtn[0];
		ABPInst.btnWide.tooltip(ABP.Strings.wideScreen);
		hoverTooltip(ABPInst.btnWide);
		/** Bind the Comment Font button **/
		var cfbtn = playerUnit.getElementsByClassName("ABP-Comment-Font");
		if (cfbtn.length <= 0) return;
		ABPInst.btnFont = cfbtn[0];
		ABPInst.btnFont.tooltip(ABP.Strings.sendStyle);
		hoverTooltip(ABPInst.btnFont);
		/** Bind the Comment Color button **/
		var ccbtn = playerUnit.getElementsByClassName("ABP-Comment-Color");
		if (ccbtn.length <= 0) return;
		ABPInst.btnColor = ccbtn[0];
		ABPInst.btnColor.tooltip(ABP.Strings.sendColor);
		hoverTooltip(ABPInst.btnColor);
		var ccd = playerUnit.getElementsByClassName("ABP-Comment-Color-Display");
		if (ccd.length <= 0) return;
		ABPInst.displayColor = ccd[0];
		/** Bind the Comment Input **/
		var cmti = playerUnit.getElementsByClassName("ABP-Comment-Input");
		if (cmti.length <= 0) return;
		ABPInst.txtText = cmti[0];
		/** Bind the Send Comment List Container **/
		var clc = playerUnit.getElementsByClassName("ABP-Comment-List-Container-Inner");
		if (clc.length <= 0) return;
		ABPInst.commentListContainer = clc[0];
		/** Bind the Send Comment button **/
		var csbtn = playerUnit.getElementsByClassName("ABP-Comment-Send");
		if (csbtn.length <= 0) return;
		ABPInst.btnSend = csbtn[0];
		ABPInst.btnSend.tooltip(ABP.Strings.sendTooltip);
		hoverTooltip(ABPInst.btnSend);
		// Controls
		var controls = playerUnit.getElementsByClassName("ABP-Control");
		if (controls.length > 0) {
			ABPInst.controlBar = controls[0];
		}
		/** Bind the Comment Disable button **/
		var cmbtn = playerUnit.getElementsByClassName("ABP-CommentShow");
		if (cmbtn.length <= 0) return;
		ABPInst.btnDm = cmbtn[0];
		ABPInst.btnDm.tooltip(ABP.Strings.hideComment);
		hoverTooltip(ABPInst.btnDm);
		/** Bind the Loop button **/
		var lpbtn = playerUnit.getElementsByClassName("ABP-Loop");
		if (lpbtn.length <= 0) return;
		ABPInst.btnLoop = lpbtn[0];
		ABPInst.btnLoop.tooltip(ABP.Strings.loopOff);
		hoverTooltip(ABPInst.btnLoop);
		
		var enabledStats={
			videoDimension:true,
			gecko:true,
			webkit:true,
			videoQuality:true,
			flvjs:true
		},document_querySelector=function(a){return document.querySelector(a)},
		to2digitFloat=function(a){return (a*1).toFixed(2)},
		lastChild='>:last-child',
		playerDimension=document_querySelector('#player-dimension'+lastChild),
		videoDimension=document_querySelector('#video-dimension'+lastChild),
		canvasFPS=document_querySelector('#canvas-fps'+lastChild),
		bufferColumn=document_querySelector('#buffer-health-column'),
		realtimeBitrateColumn=document_querySelector('#realtime-bitrate-column'),
		downloadSpeedColumn=document_querySelector('#download-speed-column'),
		downloadSpeedHlsColumn=document_querySelector('#download-speed-hls-column'),
		playFpsColumn=document_querySelector('#playback-fps-column'),
		playFpsNum = playFpsColumn.parentNode.lastChild,
		dropFpsColumn=document_querySelector('#drop-fps-column'),
		dropFpsNum = dropFpsColumn.parentNode.lastChild,
		bufferArr=[],
		realtimeBitrateArr=[],
		downloadSpeedArr=[],
		downloadSpeedHlsArr=[],
		playFpsArr=[],
		dropFpsArr=[],
		prevPlayedFrames=0,
		prevDroppedFrames=0,
		bufferNum=document_querySelector('#buffer-health'+lastChild),
		svgStats='<svg style="width:180px;height:21px"><polyline style="fill:transparent;stroke:#ccc"></polyline><polyline points="1,21 180,21 180,1" style="fill:transparent;stroke:#fff"></polyline></svg>',
		addStyle='',style=document.createElement('style'),flvjsStyle=document.createElement('style'),hlsjsStyle=document.createElement('style'),flvjsStats=document.querySelectorAll('.flvjs>:last-child'),hlsjsStats=document.querySelectorAll('.hlsjs>:last-child'),i=0,
		renderColumn=function(column,arr){
			var max=0,i,points=[];
			arr.forEach(function(i){max=(i>max)?i:max});
			max==0&&(max=1);
			for(i in arr){
				points.push(i*3 + ',' + (20*(1-arr[i]/max)+1) + ' ' + (i*3+3) +','+ (20*(1-arr[i]/max)+1));
			}
			column.setAttribute('points',points.join(' '));
		},
		playerStatsOn=false,
		contextToggle=document_querySelector('#Player-Stats-Toggle'),
		contextToggleListener=function(e){
			if(e.target.id=='stats-close')
				e.stopPropagation();
			document_querySelector('.Player-Stats').style.display=playerStatsOn?'':'block';
			playerStatsOn=!playerStatsOn;
		},
		lastCurrent=-1,
		odd=false;
		contextToggle[addEventListener]('click',contextToggleListener);
		document_querySelector('#stats-close')[addEventListener]('click',contextToggleListener);
		for(;i<60;i++){
			bufferArr.push(0);
			realtimeBitrateArr.push(0);
			downloadSpeedArr.push(0);
			downloadSpeedHlsArr.push(0);
			playFpsArr.push(0);
			dropFpsArr.push(0);
		}
		//bufferColumn=document.querySelectorAll('#buffer-health-column>span');
		bufferColumn.innerHTML=svgStats;
		bufferColumn=bufferColumn.querySelector('polyline');
		realtimeBitrateColumn.innerHTML=svgStats;
		realtimeBitrateColumn=realtimeBitrateColumn.querySelector('polyline');
		downloadSpeedColumn.innerHTML=svgStats;
		downloadSpeedColumn=downloadSpeedColumn.querySelector('polyline');
		downloadSpeedHlsColumn.innerHTML=svgStats;
		downloadSpeedHlsColumn=downloadSpeedHlsColumn.querySelector('polyline');
		playFpsColumn.innerHTML=svgStats;
		playFpsColumn=playFpsColumn.firstChild.firstChild;
		dropFpsColumn.innerHTML=svgStats;
		dropFpsColumn=dropFpsColumn.firstChild.firstChild;
		//realtimeBitrateColumn=document.querySelectorAll('#realtime-bitrate-column>span');
		if(video.videoWidth==undefined){
			enabledStats.videoDimension=false;
			addStyle+='#video-dimension{display:none}';
		}
		if(video.getVideoPlaybackQuality==undefined){
			enabledStats.videoQuality=false;
			addStyle+='.videoQuality{display:none}'
		}
		style.innerHTML=addStyle,
		document.head.appendChild(style);
		flvjsStyle.innerHTML='.flvjs{display:none}';
		document.head.appendChild(flvjsStyle);
		hlsjsStyle.innerHTML='.hlsjs{display:none}';
		document.head.appendChild(hlsjsStyle);
		
		setInterval(function(){
			odd=!odd;
			playerDimension.innerHTML=video.offsetWidth+'x'+video.offsetHeight+' *'+devicePixelRatio;
			if(enabledStats.videoDimension){
				videoDimension.innerHTML=video.videoWidth+'x'+video.videoHeight;
			}
			
			var buffer={};
			try{
				buffer=getBuffer(video);
			}catch(e){}
			buffer=buffer.delta||0
			bufferArr.push(buffer);
			bufferArr.shift();
			bufferNum.innerHTML=to2digitFloat(buffer)+'s';
			renderColumn(bufferColumn,bufferArr);
			
			//Buffer Clip Render
			if(playerStatsOn){
				var buffered = video.buffered,
				clipsContainer=document_querySelector('#buffer-clips>span');
				
				var duration = video.duration==Infinity ? buffered.end(buffered.length-1) : video.duration,
				clipsTitle=[];
				for(var i=0,start,length,clipsArr=[];i<buffered.length;i++){
					if(i>=clipsContainer.childNodes.length){
						clipsContainer.appendChild(_('span',{className:'buffer-clip'}));
					}
					start = buffered.start(i);
					length = buffered.end(i) - start;
					clipsContainer.childNodes[i].style.left=to2digitFloat(start/duration*100) + '%';
					clipsContainer.childNodes[i].style.width=to2digitFloat(length / duration * 100) + '%';
					clipsTitle.push(formatTime(start|0)+' - '+formatTime((start+length)|0));
				}
				while(i<clipsContainer.childNodes.length){
					clipsContainer.childNodes[i].remove();
				}
				clipsContainer.parentNode.parentNode.childNodes[2].innerHTML=clipsTitle.join('\n');
				document_querySelector('#buffer-clips>span>div').style.left = to2digitFloat(video.currentTime / duration*100) + '%';
			}
			
			if(player.flv!=null){
				flvjsStyle.textContent='';
				var i=0,mediaInfo=player.flv._mediaInfo,statisticsInfo=player.flv.statisticsInfo,currentTime=video.currentTime,segs=player.flv._mediaDataSource.segments,timeOffset=0,off=0,bitrate,timeIndex;
				for(timeIndex=0;timeIndex < segs.length;timeIndex++){
					if(currentTime<=(timeOffset+segs[timeIndex].duration)/1e3){
						//console.log(off,timeOffset,currentTime)
						timeOffset=(currentTime-timeOffset/1e3)|0;
						break;
					}else{
						timeOffset+=segs[timeIndex].duration;
						off++
					}
				}
				
				/*['mimeType','audioCodec','videoCodec'].forEach(function(name){
					flvjsStats[i++].innerHTML=mediaInfo[name];
				})*/
				flvjsStats[i++].textContent=mediaInfo.videoCodec || '';
				flvjsStats[i++].textContent=mediaInfo.audioCodec || '';
				flvjsStats[i++].textContent=to2digitFloat(mediaInfo.fps);
				flvjsStats[i++].textContent=to2digitFloat(mediaInfo.videoDataRate)+' kbps';
				flvjsStats[i++].textContent=to2digitFloat(mediaInfo.audioDataRate)+' kbps';
				
				if(mediaInfo.bitrateMap){
					var currentTime=video.currentTime,timeOffset=currentTime|0,off=0,bitrate;
					if(mediaInfo.bitrateMap[off])
						bitrate=mediaInfo.bitrateMap[off][timeOffset]
					if(bitrate!=undefined){
						if(odd && lastCurrent!=(video.currentTime|0)){
							lastCurrent=video.currentTime|0;
							flvjsStats[i++].textContent=to2digitFloat(bitrate)+' kbps';
							realtimeBitrateArr.push(bitrate);
							realtimeBitrateArr.shift();
							if(playerStatsOn)
								renderColumn(realtimeBitrateColumn,realtimeBitrateArr);
						}else{
							i++;
						}
					}else{
						flvjsStats[i++].textContent='N/A';
					}
				}else{
					flvjsStats[i++].textContent='N/A'
				}
				if(odd){
					if (typeof statisticsInfo.speed == 'number'){
						downloadSpeedArr.push(statisticsInfo.speed);
						downloadSpeedArr.shift();
					}
					if(playerStatsOn)
						renderColumn(downloadSpeedColumn,downloadSpeedArr);
					flvjsStats[i++].textContent=to2digitFloat(statisticsInfo.speed)+' KB/s'
					player.flv._statisticsInfo.speed=0;
				}else{
					i++;
				}
			}else{
				flvjsStyle.textContent='.flvjs{display:none}';
				var segSeperatorChild = document_querySelector('#buffer-clips>span:nth-of-type(2)').children;
				while(segSeperatorChild.length > 1){
					segSeperatorChild[1].remove();
				}
			}
			
			if(player.hls!=null){
				hlsjsStyle.innerHTML='';
				var percentage=0,loader,i=0;
				if(player.hls.fragmentLoader.loaders.main!=undefined){
					loader=player.hls.fragmentLoader.loaders.main
					if(loader.stats.total)
					percentage=loader.stats.loaded/loader.stats.total*100
				}
				document_querySelector('#download-progress-hls').style.width=percentage+'%';
				hlsjsStats[i++].innerHTML=to2digitFloat(percentage)+'%'
				if(odd){
					var speed=player.hls.speed||0;
					downloadSpeedHlsArr.push(speed);
					downloadSpeedHlsArr.shift();
					if(playerStatsOn)
						renderColumn(downloadSpeedHlsColumn,downloadSpeedHlsArr);
					hlsjsStats[i++].innerHTML=to2digitFloat(speed)+' KB/s'
				}
			}else{
				hlsjsStyle.innerHTML='.hlsjs{display:none}';
			}
			
			if(odd)
				canvasFPS.innerHTML = ABPInst.cmManager.canvasFPS;
			
			if(odd && enabledStats.videoQuality){
				var quality=video.getVideoPlaybackQuality();
				if (prevPlayedFrames > quality.totalVideoFrames) prevPlayedFrames = 0;
				if (prevDroppedFrames > quality.droppedVideoFrames) prevDroppedFrames = 0;
				var playedFrames=quality.totalVideoFrames - prevPlayedFrames;
				var droppedFrames=quality.droppedVideoFrames - prevDroppedFrames;
				prevPlayedFrames = quality.totalVideoFrames;
				prevDroppedFrames = quality.droppedVideoFrames;
				playFpsArr.push(playedFrames); playFpsArr.shift();
				dropFpsArr.push(droppedFrames); dropFpsArr.shift();
				if(playerStatsOn)
					renderColumn(playFpsColumn, playFpsArr),
					renderColumn(dropFpsColumn, dropFpsArr);
				playFpsNum.textContent = playedFrames + ' fps';
				dropFpsNum.textContent = droppedFrames + ' fps ' + (droppedFrames/playedFrames*100).toFixed(2)+'%';
			}
		},500)
		
		/** Create a commentManager if possible **/
		if (typeof CommentManager !== "undefined") {
			ABPInst.cmManager = new CommentManager(ABPInst.divComment);
			ABPInst.cmManager.display = true;
			ABPInst.cmManager.init();
			ABPInst.cmManager.clear();
			ABPInst.cmManager.filter.addModifier(shield.filter);
			ABPInst.cmManager.startTimer();
			if (window) {
				window[addEventListener]("resize", function() {
					//Notify on resize
					ABPInst.cmManager.setBounds();
				});
			}
		}
		if (typeof ABP.playerConfig == "object") {
			if (ABP.playerConfig.volume) ABPInst.video.volume = ABP.playerConfig.volume;
			if (ABP.playerConfig.opacity) ABPInst.cmManager.options.global.opacity = ABP.playerConfig.opacity;
		}
		if (video.isBound !== true) {
			ABPInst.swapVideo(video);
			ABPInst.playerUnit.querySelector('.BiliPlus-Scale-Menu .Video-Defination')[addEventListener]('click',function(e){
				if(!e.target.hasAttribute('changeto'))
					return false;
				var t=JSON.parse(e.target.getAttribute('changeto'));
				changeSrc({target:{value:t[1]}},t[0]);
				removeClass(e.target.parentNode.querySelector('.on'),'on');
				addClass(e.target, 'on');
			});
			ABPInst.playerUnit.querySelector('.BiliPlus-Scale-Menu .Video-Scale')[addEventListener]('click',function(e){
				if(!e.target.hasAttribute('changeto'))
					return false;
				switch( e.target.getAttribute('changeto') ){
					case 'default':
						if( hasClass(ABPInst.video, 'scale') ){
							removeClass(ABPInst.video, 'scale');
						}
						ABPInst.video.style.width='';
						ABPInst.video.style.height='';
						ABPInst.video.style.paddingTop='';
						ABPInst.video.style.paddingLeft='';
					break;
					case '16_9':
						addClass(ABPInst.video, 'scale');
						var width=ABPInst.videoDiv.offsetWidth, height=ABPInst.videoDiv.offsetHeight, paddingTop='', paddingLeft='';
						if( width < (height/9*16) ){
							//Calc base on width
							paddingTop=( height-(width/16*9) )/2+'px';
							height=( (width/16*9)/height *100)+'%';
							width='100%';
						}else{
							//Calc base on height
							paddingLeft=( width-(height/9*16) )/2+'px';
							width=( (height/9*16)/width *100)+'%';
							height='100%';
						}
						ABPInst.video.style.width=width;
						ABPInst.video.style.height=height;
						ABPInst.video.style.paddingTop=paddingTop;
						ABPInst.video.style.paddingLeft=paddingLeft;
					break;
					case '4_3':
						addClass(ABPInst.video, 'scale');
						var width=ABPInst.videoDiv.offsetWidth, height=ABPInst.videoDiv.offsetHeight, paddingTop='', paddingLeft='';
						if( width < (height/3*4) ){
							//Calc base on width
							paddingTop=( height-(width/4*3) )/2+'px';
							height=( (width/4*3)/height *100)+'%';
							width='100%';
						}else{
							//Calc base on height
							paddingLeft=( width-(height/3*4) )/2+'px';
							width=( (height/3*4)/width *100)+'%';
							height='100%';
						}
						ABPInst.video.style.width=width;
						ABPInst.video.style.height=height;
						ABPInst.video.style.paddingTop=paddingTop;
						ABPInst.video.style.paddingLeft=paddingLeft;
					break;
					case 'full':
						addClass(ABPInst.video, 'scale');
						ABPInst.video.style.width='';
						ABPInst.video.style.height='';
						ABPInst.video.style.paddingTop='';
						ABPInst.video.style.paddingLeft='';
					break;
				}
				removeClass(e.target.parentNode.querySelector('.on'),'on');
				addClass(e.target, 'on');
			});
			var lastClick=0,
			videoDivClickEventListener=function(e) {
				var now=Date.now();
				if(now-lastClick<=500){
					ABPInst.btnFull.click();
				}else{
					if(video.paused){
						ABPInst.btnPlay.click();
					}
				}
				lastClick=now;
				e.preventDefault();
			};
			ABPInst.videoDiv[addEventListener]("click", videoDivClickEventListener);
			ABPInst.playerUnit.querySelector('.ABP-Bottom-Extend')[addEventListener]('click',function(e){
				e.preventDefault();
				e.stopPropagation();
				videoDivClickEventListener(e);
			})
			var hideCursorTimer = null;
			ABPInst.videoDiv[addEventListener]("mousemove", function() {
				if (hideCursorTimer) {
					window.clearTimeout(hideCursorTimer);
				}
				if (hasClass(ABPInst.videoDiv, "ABP-HideCursor")) {
					removeClass(ABPInst.videoDiv, "ABP-HideCursor");
				}
				hideCursorTimer = window.setTimeout(function() {
					addClass(ABPInst.videoDiv, "ABP-HideCursor");
				}, 3000);
			});
			ABPInst.btnVolume[addEventListener]("click", function() {
				if (ABPInst.video.muted == false) {
					ABPInst.video.muted = true;
					this.className = "button ABP-Volume icon-volume-mute2";
					this.tooltip(ABP.Strings.unmute);
					ABPInst.barVolume.style.width = "0%";
				} else {
					ABPInst.video.muted = false;
					this.className = "button ABP-Volume icon-volume-";
					if (ABPInst.video.volume < .10) this.className += "mute";
					else if (ABPInst.video.volume < .33) this.className += "low";
					else if (ABPInst.video.volume < .67) this.className += "medium";
					else this.className += "high";
					this.tooltip(ABP.Strings.mute);
					ABPInst.barVolume.style.width = (ABPInst.video.volume * 100) + "%";
				}
			});
			ABPInst.btnWebFull[addEventListener]("click", function() {
				ABPInst.state.fullscreen = hasClass(playerUnit, "ABP-FullScreen");
				addClass(playerUnit, "ABP-FullScreen");
				if(unsafeWindow && unsafeWindow.player_fullwin)
					unsafeWindow.player_fullwin(true)
				ABPInst.btnFull.className = "button ABP-FullScreen icon-screen-normal";
				ABPInst.btnFull.tooltip(ABP.Strings.exitWebFull);
				ABPInst.state.fullscreen = true;
				if (ABPInst.cmManager)
					ABPInst.cmManager.setBounds();
				if (!ABPInst.state.allowRescale) return;
				if (ABPInst.state.fullscreen) {
					if (ABPInst.defaults.w > 0) {
						ABPInst.cmManager.options.scrollScale = playerUnit.offsetWidth / ABPInst.defaults.w;
					}
				} else {
					ABPInst.cmManager.options.scrollScale = 1;
				}
			});
			var fontOn=false,colorOn=false;
			ABPInst.btnFont[addEventListener]("click", function(e) {
				if(colorOn)
					ABPInst.btnColor.click();
				this.parentNode.classList.toggle("on");
				fontOn=!fontOn
			});
			ABPInst.btnColor[addEventListener]("click", function(e) {
				if(fontOn)
					ABPInst.btnFont.click();
				this.parentNode.classList.toggle("on");
				colorOn=!colorOn
			});
			ABPInst.btnAutoOpacity[addEventListener]("click", function(e) {
				this.classList.toggle("on");
				var autoOpacity=this.classList.contains("on");
				ABPInst.cmManager.autoOpacity(autoOpacity);
				this.tooltip(autoOpacity ? ABP.Strings.autoOpacityOn : ABP.Strings.autoOpacityOff);
				saveSetting.autoOpacity();
			});
			if (ABP.playerConfig.autoOpacity) ABPInst.btnAutoOpacity.click();
			ABPInst.btnProp[addEventListener]("click", function(e) {
				this.classList.toggle("on");
				var useCSS=this.classList.contains("on");
				ABPInst.cmManager.useCSS(useCSS);
				this.tooltip(useCSS ? ABP.Strings.usingCSS : ABP.Strings.usingCanvas)
				saveSetting.useCSS();
			});
			if (ABP.playerConfig.useCSS) ABPInst.btnProp.click();
			var fullscreenChangeHandler = function() {
				if (!document.isFullScreen() && hasClass(playerUnit, "ABP-FullScreen")) {
					removeClass(playerUnit, "ABP-FullScreen");
					ABPInst.btnFull.className = "button ABP-FullScreen icon-screen-full";
					ABPInst.btnFull.tooltip(ABP.Strings.fullScreen);
					ABPInst.state.fullscreen=!!document.isFullScreen();
					//ABPInst.btnLoop.click();ABPInst.btnLoop.click();
				}
			}
			document[addEventListener]("fullscreenchange", fullscreenChangeHandler, false);
			document[addEventListener]("webkitfullscreenchange", fullscreenChangeHandler, false);
			document[addEventListener]("mozfullscreenchange", fullscreenChangeHandler, false);
			document[addEventListener]("MSFullscreenChange", fullscreenChangeHandler, false);
			ABPInst.btnFull[addEventListener]("click", function() {
				ABPInst.state.fullscreen = hasClass(playerUnit, "ABP-FullScreen");
				if (!ABPInst.state.fullscreen) {
					addClass(playerUnit, "ABP-FullScreen");
					this.className = "button ABP-FullScreen icon-screen-normal";
					this.tooltip(ABP.Strings.exitFullScreen);
					playerUnit.requestFullScreen();
				} else {
					removeClass(playerUnit, "ABP-FullScreen");
					if(unsafeWindow && unsafeWindow.player_fullwin)
						unsafeWindow.player_fullwin(false)
					this.className = "button ABP-FullScreen icon-screen-full";
					this.tooltip(ABP.Strings.fullScreen);
					document.exitFullscreen();
				}
				ABPInst.state.fullscreen = !ABPInst.state.fullscreen;
				if (ABPInst.cmManager)
					ABPInst.cmManager.setBounds();
				if (!ABPInst.state.allowRescale) return;
				if (ABPInst.state.fullscreen) {
					if (ABPInst.defaults.w > 0) {
						ABPInst.cmManager.options.scrollScale = playerUnit.offsetWidth / ABPInst.defaults.w;
					}
				} else {
					ABPInst.cmManager.options.scrollScale = 1;
				}
			});

			ABPInst.btnWide[addEventListener]("click", function() {
				ABPInst.state.widescreen = hasClass(playerUnit, "ABP-WideScreen");
				if (!ABPInst.state.widescreen) {
					addClass(playerUnit, "ABP-WideScreen");
					this.className = "button ABP-WideScreen icon-tv on";
					playerUnit.dispatchEvent(new Event("wide"));
					this.tooltip(ABP.Strings.exitWideScreen);
				} else {
					removeClass(playerUnit, "ABP-WideScreen");
					this.className = "button ABP-WideScreen icon-tv";
					playerUnit.dispatchEvent(new Event("normal"));
					this.tooltip(ABP.Strings.wideScreen);
				}
				ABPInst.state.widescreen = !ABPInst.state.widescreen;
				if (ABPInst.cmManager)
					ABPInst.cmManager.setBounds();
				if (!ABPInst.state.allowRescale) return;
				if (ABPInst.state.fullscreen) {
					if (ABPInst.defaults.w > 0) {
						ABPInst.cmManager.options.scrollScale = playerUnit.offsetWidth / ABPInst.defaults.w;
					}
				} else {
					ABPInst.cmManager.options.scrollScale = 1;
				}
			});
			ABPInst.btnDm[addEventListener]("click", function() {
				if (ABPInst.cmManager.display == false) {
					ABPInst.cmManager.display = true;
					ABPInst.cmManager.startTimer();
					this.className = "button ABP-CommentShow icon-comment on";
					this.tooltip(ABP.Strings.hideComment);
				} else {
					ABPInst.cmManager.display = false;
					ABPInst.cmManager.clear();
					ABPInst.cmManager.stopTimer();
					this.className = "button ABP-CommentShow icon-comment";
					this.tooltip(ABP.Strings.showComment);
				}
				saveSetting.commentVisible();
			});
			ABPInst.btnLoop[addEventListener]("click", function() {
				if(player.flv!=null){
					player.flv.unload();
					player.flv.load();
					ABPInst.video.currentTime=0;
					ABPInst.video.play();
				}
			});
			var contextMenu=ABPInst.playerUnit.querySelector('.Context-Menu'),
			contextMenuBackground=contextMenu.querySelector('.Context-Menu-Background'),
			contextMenuBody=contextMenu.querySelector('.Context-Menu-Body'),
			dismissListener=function(e){
				if(activingContext){
					e.preventDefault();
					e.stopPropagation();
					activingContext=!1;
					return false;
				}
				contextMenu.style.display='none';
				e.preventDefault();
			},
			commentLocating=function(id){
				var i=0,found=-1
				for(var i=0,len=ABPInst.commentObjArray.length;i<len;i++){
					if(ABPInst.commentObjArray[i].data.originalData.dbid == id){
						found=i;
						break;
					}
				}
				if(found==-1)
					return;
				if(ABPInst.state.fullscreen)
					ABPInst.btnFull.click();
				if(ABPInst.state.widescreen)
					ABPInst.btnWide.click();
				ABPInst.commentListContainer.parentNode.scrollTop=found*24;
			},
			senderInfoTimeout=null,senderInfoDivTimeout=null,currentSender=0,currentSenderDiv=null,
			senderInfoCache={},
			getSenderInfo=function(){
				if(currentSender==0)
					return;
				if(senderInfoCache[currentSender]!=undefined){
					contextMenuBody.dispatchEvent(new CustomEvent('senderInfoFetched',{detail:senderInfoCache[currentSender]}))
					return;
				}
				var s=_('script',{className:'info_jsonp',src:'//account.bilibili.com/api/member/getCardByMid?type=jsonp&callback=getSenderInfo&mid='+currentSender});
				document.body.appendChild(s);
			},
			showContextMenu=function(x,y,dmList){
				contextMenu.style.display='block';
				var aboutDiv,remove=contextMenuBody.querySelectorAll('.dm'),originalData,color,isWhite,containerBox=ABPInst.playerUnit.getBoundingClientRect(),
				dmitem;
				for(i=remove.length-2;i>=0;i--){
					remove[i].remove();
				}
				aboutDiv=contextMenuBody.firstChild;
				for(i=0;i<dmList.length;i++){
					originalData=dmList[i].originalData;
					color=originalData.color.toString(16).padStart(6,'0');
					isWhite= (originalData.color==0xffffff);
					dmitem=_('div',{className:'dm'},[
						_('div',{className:'content'},[_('text',originalData.text)]),
						_('div',{className:'dmMenu'},[
							_('div',{'data-content':originalData.text},[_('text',ABP.Strings.copyComment)]),
							_('div',{'data-dmid':originalData.dbid},[_('text',ABP.Strings.findComment)]),
							_('div',{onclick:'shield.addText("'+originalData.text+'")'},[_('text',ABP.Strings.blockContent+'“'+originalData.text+'”')]),
							_('div',{'data-mid':crc_engine(originalData.hash),onclick:'shield.addUser("'+originalData.hash+'")'},[_('text',ABP.Strings.blockUser+''+originalData.hash+'(mid:'+crc_engine(originalData.hash)+')')]),
							_('div',(isWhite)?{}:{onclick:'shield.addColor("'+color+'")'},[_('text',isWhite?ABP.Strings.blockColorWhite:ABP.Strings.blockColor+''),_('div',{className:'color',style:{background:'#'+color}})])
						])
					])
					if(originalData.mode>6){
						dmitem.childNodes[0].innerHTML='特殊弹幕';
						var dmMenu=dmitem.childNodes[1];
						dmMenu.childNodes[0].style.display='none';
						dmMenu.childNodes[2].style.display='none';
						dmMenu.childNodes[4].style.display='none';
					}
					contextMenuBody.insertBefore(dmitem,aboutDiv);
				}
				var itemMenu=contextMenuBody.querySelectorAll('.dmMenu');
				for(i=0;i<itemMenu.length-1;i++){
					itemMenu[i].childNodes[0][addEventListener]('click',function(){
						try{
							var copy=document.createElement('input');
							copy.style.width=0;
							copy.style.height=0;
							document.body.appendChild(copy);
							copy.value=this.getAttribute('data-content');
							copy.select();
							var success=document.execCommand('copy');
							document.body.removeChild(copy);
							if(!success)
								throw '';
						}catch(e){
							ABPInst.createPopup(ABP.Strings.copyFail,3e3)
						}
					});
					itemMenu[i].childNodes[1][addEventListener]('click',function(){
						commentLocating(this.getAttribute('data-dmid'));
					})
					itemMenu[i].childNodes[3][addEventListener]('mouseenter',function(){
						currentSender=this.getAttribute('data-mid');
						currentSenderDiv=this;
						senderInfoTimeout=setTimeout(getSenderInfo,500);
					})
					itemMenu[i].childNodes[3][addEventListener]('mouseleave',function(){
						clearTimeout(senderInfoTimeout);
						currentSender=0;
						currentSenderDiv=null;
						if(document.getElementById('Sender-Info')!=null){
							clearTimeout(senderInfoDivTimeout);
							senderInfoDivTimeout=setTimeout(function(){document.body.removeChild(document.getElementById('Sender-Info'))},500);
						}
					})
				};
				x-=containerBox.left;
				y-=containerBox.top;
				if( containerBox.width-x <300)
					x=containerBox.width-300;
				if( containerBox.height-contextMenuBody.offsetHeight-y <0)
					y=containerBox.height-contextMenuBody.offsetHeight;
				var lastMenu=contextMenuBody.querySelector('.dm:nth-last-of-type(2)>.dmMenu')
				if(lastMenu!=null){
					lastMenu.style.display='block';
					var lastMenuBox=lastMenu.getBoundingClientRect();
					lastMenu.style.display='';
					if( containerBox.top+containerBox.height-lastMenuBox.height-y <0)
						y=containerBox.height-lastMenuBox.height;
				}
				contextMenuBody.style.left=x+'px';
				contextMenuBody.style.top=y+'px';
			},
			touchContextTimer=null,activingContext=!1;
			contextMenuBody.querySelector('#Player-Speed-Control .dmMenu')[addEventListener]('click',function(e){
				var speed=e.target.getAttribute('data-speed');
				if(speed!=undefined)
					ABPInst.video.playbackRate = speed;
			});
			contextMenuBody[addEventListener]('senderInfoFetched',function(e){
				var card=e.detail;
				if(card.mid!=currentSender || currentSenderDiv==null){
					return;
				}
				var box=currentSenderDiv.parentNode.getBoundingClientRect(),x=box.left-150,y=innerHeight-box.bottom,
				infoDiv=_('div',{className:'Context-Menu-Body',id:'Sender-Info',style:{
					left:x+'px',
					bottom:y+'px',
					position:'fixed',
					fontFamily:"-apple-system,Arial,'PingFang SC','STHeiti Light','Hiragino Kaku Gothic ProN','Microsoft YaHei'",
					textAlign:'center'
				}},[
					_('div',{},[
						_('img',{style:{height:'130px',width:'130px'},src:card.face.replace(/http\:/,'')})
					]),
					_('div',{},[_('text',card.name)]),
					_('div',{},[_('text',card.mid)]),
					_('div',{},[_('text','LV'+card.level_info.current_level)])
				]);
				document.body.appendChild(infoDiv);
				if((y+infoDiv.offsetHeight)>innerHeight){
					infoDiv.style.bottom='';
					infoDiv.style.top=(box.top)+'px';
				}
				infoDiv[addEventListener]('click',function(){
					window.open('/space/'+card.mid+'/');
					document.body.removeChild(infoDiv);
				})
				infoDiv[addEventListener]('mouseenter',function(){
					clearTimeout(senderInfoDivTimeout);
				})
				infoDiv[addEventListener]('mouseleave',function(){
					clearTimeout(senderInfoDivTimeout);
					senderInfoDivTimeout=setTimeout(function(){document.body.removeChild(document.getElementById('Sender-Info'))},500);
				})
			})
			window.getSenderInfo=function(json){
				if(json.code==0){
					senderInfoCache[currentSender]=json.card;
					contextMenuBody.dispatchEvent(new CustomEvent('senderInfoFetched',{detail:json.card}))
				}
			}
			contextMenu[addEventListener]('click',dismissListener);
			contextMenuBackground[addEventListener]('contextmenu',dismissListener);
			ABPInst.videoDiv.parentNode[addEventListener]('contextmenu',function(e){
				e.preventDefault();
				e.stopPropagation();
				var box=ABPInst.divComment.getBoundingClientRect(),x=e.clientX,
				y=e.clientY;
				showContextMenu(x,y,ABPInst.cmManager.getCommentFromPoint(x-box.left,y-box.top));
			})
			ABPInst.commentListContainer[addEventListener]('contextmenu',function(e){
				var dmData=e.target.parentNode.data
				if(dmData==undefined)
					return false;
				e.preventDefault();
				e.stopPropagation();
				showContextMenu(e.clientX,e.clientY,[dmData]);
			});

			var saveConfigurations = function() {
				ABPInst.playerUnit.dispatchEvent(new CustomEvent("saveconfig", {
					"detail": {
						"volume": ABPInst.video.volume,
						"opacity": ABPInst.cmManager.options.global.opacity,
						"scale": ABPInst.commentScale,
						"prop": ABPInst.proportionalScale
					}
				}));
			}

			var sendComment = function() {
				var date = new Date(),
					commentId = "" + date.getTime() + Math.random();
				if (ABPInst.txtText.value == "" || ABPInst.txtText.disabled) return false;
				ABPInst.playerUnit.dispatchEvent(new CustomEvent("sendcomment", {
					"detail": {
						"id": commentId,
						"message": ABPInst.txtText.value,
						"fontsize": ABPInst.commentFontSize,
						"color": parseInt("0x" + ABPInst.commentColor),
						"date": date.getFullYear() + "-" + pad(date.getMonth()) + "-" + pad(date.getDay()) +
							" " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds()),
						"playTime": ABPInst.video.currentTime,
						"mode": ABPInst.commentMode,
						"pool": 0
					}
				}));
				ABPInst.cmManager.send({
					"text": ABPInst.txtText.value,
					"mode": ABPInst.commentMode,
					"stime": ABPInst.video.currentTime,
					"size": ABPInst.commentFontSize,
					"color": parseInt("0x" + ABPInst.commentColor),
					"border": true
				});
				ABPInst.commentList[commentId] = {
					"date": parseInt(date.getTime() / 1000),
					"time": ABPInst.video.currentTime * 1000,
					"mode": ABPInst.commentMode,
					"user": "-",
					"pool": 0,
					"content": ABPInst.txtText.value
				}
				ABPInst.txtText.value = "";
				ABPInst.txtText.disabled = true;
				setTimeout(function() {
					ABPInst.txtText.disabled = false;
				}, ABPInst.commentCoolDown);
			};

			ABPInst.txtText.parentNode[addEventListener]("submit", function(e) {
				e.preventDefault();
				sendComment();
				return false;
			});

			ABPInst.btnSend[addEventListener]("click", sendComment);

			ABPInst.timeLabel[addEventListener]("click", function() {
				ABPInst.timeJump = _("input", {
					"className": "time-jump"
				});
				ABPInst.timeJump.value = formatTime(ABPInst.video.currentTime);
				ABPInst.controlBar.appendChild(ABPInst.timeJump);
				ABPInst.timeJump[addEventListener]("blur", function() {
					if (ABPInst.timeJump) ABPInst.timeJump.parentNode.removeChild(ABPInst.timeJump);
					ABPInst.timeJump = null;
				});
				ABPInst.timeJump[addEventListener]("keydown", function(e) {
					if (e.keyCode == 13) {
						var time = convertTime(ABPInst.timeJump.value);
						if (time && time <= ABPInst.video.duration) {
							ABPInst.video.currentTime = time;
							if (ABPInst.video.paused) ABPInst.btnPlay.click();
						}
						ABPInst.timeJump.parentNode.removeChild(ABPInst.timeJump);
					} else if ((e.keyCode < 48 || e.keyCode > 59) && (e.keyCode < 96 || e.keyCode > 105) && e.keyCode != 8 && e.keyCode != 16 && e.keyCode != 37 && e.keyCode != 39 && e.keyCode != 46) {
						e.preventDefault();
					}
				});
				ABPInst.timeJump.focus();
				ABPInst.timeJump.select();
			});
			ABPInst.barTime.style.width = "0%";
			ABPInst.barFullScreenTime.style.width = "0%";
			var dragging = false;
			ABPInst.barTimeHitArea[addEventListener]("mousedown", function(e) {
				dragging = true;
			});
			document[addEventListener]("mouseup", function(e) {
				if (dragging) {
					var buff=getBuffer(ABPInst.video),
					duration=buff.end-buff.start,
					newTime = ((e.clientX - ABPInst.barTimeHitArea.getBoundingClientRect().left) / ABPInst.barTimeHitArea.offsetWidth) * duration;
					newTime+=buff.start
					if (newTime < 0) newTime = 0;
					if (Math.abs(newTime - ABPInst.video.currentTime) > 4) {
						if (ABPInst.cmManager)
							ABPInst.cmManager.clear();
					}
					ABPInst.video.currentTime = newTime;
				}
				dragging = false;
			});
			var updateTime = function(time) {
				var buff=getBuffer(ABPInst.video),
				duration=buff.end-buff.start,
				time=time-buff.start
				ABPInst.barTime.style.width = (time / duration * 100) + "%";
				ABPInst.barFullScreenTime.style.width = (time / duration * 100) + "%";
				ABPInst.timeLabel.innerHTML = formatTime(time) + '/' + formatTime(duration);
			}
			document[addEventListener]("mousemove", function(e) {
				var buff=getBuffer(ABPInst.video),
				duration=buff.end,
				newTime = ((e.clientX - ABPInst.barTimeHitArea.getBoundingClientRect().left) / ABPInst.barTimeHitArea.offsetWidth) * duration;
				if (newTime < 0) newTime = 0;
				if (newTime > duration) newTime = duration;
				ABPInst.barTimeHitArea.tooltip(formatTime(newTime));
				if (dragging) {
					updateTime(newTime);
				}
			});
			hoverTooltip(ABPInst.barTimeHitArea, true, -12);
			var draggingVolume = false;
			ABPInst.barVolumeHitArea[addEventListener]("mousedown", function(e) {
				draggingVolume = true;
			});
			var hideVolumeTimeout=null,
			showVolume = function(){
				hideVolumeTimeout && clearTimeout(hideVolumeTimeout)
				addClass(playerUnit,'volume-show');
			},
			hideVolume = function(){
				hideVolumeTimeout = setTimeout(function(){removeClass(playerUnit,'volume-show');},2e3);
			}
			ABPInst.barVolumeHitArea[addEventListener]('mouseenter',showVolume);
			ABPInst.btnVolume[addEventListener]('mouseenter',showVolume);
			ABPInst.barVolumeHitArea[addEventListener]('mouseleave',hideVolume);
			ABPInst.btnVolume[addEventListener]('mouseleave',hideVolume);
			ABPInst.barVolume.style.width = (ABPInst.video.volume * 100) + "%";
			var updateVolume = function(volume) {
				ABPInst.barVolume.style.width = (volume * 100) + "%";
				ABPInst.video.muted = false;
				ABPInst.btnVolume.className = "button ABP-Volume icon-volume-";
				if (volume < .10) ABPInst.btnVolume.className += "mute";
				else if (volume < .33) ABPInst.btnVolume.className += "low";
				else if (volume < .67) ABPInst.btnVolume.className += "medium";
				else ABPInst.btnVolume.className += "high";
				ABPInst.btnVolume.tooltip(ABP.Strings.mute);
				ABPInst.barVolumeHitArea.tooltip(parseInt(volume * 100) + "%");
				saveConfigurations();
			}
			document[addEventListener]("mouseup", function(e) {
				if (draggingVolume) {
					var newVolume = (e.clientX - ABPInst.barVolumeHitArea.getBoundingClientRect().left) / ABPInst.barVolumeHitArea.offsetWidth;
					if (newVolume < 0) newVolume = 0;
					if (newVolume > 1) newVolume = 1;
					ABPInst.video.volume = newVolume;
					updateVolume(ABPInst.video.volume);
				}
				draggingVolume = false;
			});
			document[addEventListener]("mousemove", function(e) {
				var newVolume = (e.clientX - ABPInst.barVolumeHitArea.getBoundingClientRect().left) / ABPInst.barVolumeHitArea.offsetWidth;
				if (newVolume < 0) newVolume = 0;
				if (newVolume > 1) newVolume = 1;
				if (draggingVolume) {
					ABPInst.video.volume = newVolume;
					updateVolume(ABPInst.video.volume);
				} else {
					ABPInst.barVolumeHitArea.tooltip(parseInt(newVolume * 100) + "%");
				}
			});
			hoverTooltip(ABPInst.barVolumeHitArea, true, -12);
			var draggingOpacity = false;
			ABPInst.barOpacityHitArea[addEventListener]("mousedown", function(e) {
				draggingOpacity = true;
			});
			ABPInst.barOpacity.style.width = (ABPInst.cmManager.options.global.opacity * 100) + "%";
			var updateOpacity = function(opacity) {
				ABPInst.barOpacity.style.width = (opacity * 100) + "%";
				ABPInst.barOpacityHitArea.tooltip(parseInt(opacity * 100) + "%");
				saveConfigurations();
			}
			document[addEventListener]("mouseup", function(e) {
				if (draggingOpacity) {
					var newOpacity = (e.clientX - ABPInst.barOpacityHitArea.getBoundingClientRect().left) / ABPInst.barOpacityHitArea.offsetWidth;
					if (newOpacity < 0) newOpacity = 0;
					if (newOpacity > 1) newOpacity = 1;
					ABPInst.cmManager.options.global.opacity = newOpacity;
					updateOpacity(ABPInst.cmManager.options.global.opacity);
					saveSetting.opacity();
				}
				draggingOpacity = false;
			});
			document[addEventListener]("mousemove", function(e) {
				var newOpacity = (e.clientX - ABPInst.barOpacityHitArea.getBoundingClientRect().left) / ABPInst.barOpacityHitArea.offsetWidth;
				if (newOpacity < 0) newOpacity = 0;
				if (newOpacity > 1) newOpacity = 1;
				if (draggingOpacity) {
					ABPInst.cmManager.options.global.opacity = newOpacity;
					updateOpacity(ABPInst.cmManager.options.global.opacity);
				} else {
					ABPInst.barOpacityHitArea.tooltip(parseInt(newOpacity * 100) + "%");
				}
			});
			hoverTooltip(ABPInst.barOpacityHitArea, true, -6);
			var draggingScale = false;
			ABPInst.barScaleHitArea[addEventListener]("mousedown", function(e) {
				draggingScale = true;
			});
			ABPInst.barScale.style.width = (ABPInst.commentScale - 0.2) / 1.8 * 100 + "%";
			var updateScale = function(scale) {
				ABPInst.barScale.style.width = (scale - 0.2) / 1.8 * 100 + "%";
				ABPInst.barScaleHitArea.tooltip(parseInt(scale * 100) + "%");
				ABPInst.cmManager.setBounds();
				saveConfigurations();
			}
			document[addEventListener]("mouseup", function(e) {
				if (draggingScale) {
					var newScale = 0.2 + 1.8 * (e.clientX - ABPInst.barScaleHitArea.getBoundingClientRect().left) / ABPInst.barScaleHitArea.offsetWidth;
					if (newScale < 0.2) newScale = 0.2;
					if (newScale > 2) newScale = 2;
					ABPInst.commentScale = newScale;
					updateScale(ABPInst.commentScale);
					saveSetting.scale();
				}
				draggingScale = false;
			});
			document[addEventListener]("mousemove", function(e) {
				var newScale = 0.2 + 1.8 * (e.clientX - ABPInst.barScaleHitArea.getBoundingClientRect().left) / ABPInst.barScaleHitArea.offsetWidth;
				if (newScale < 0.2) newScale = 0.2;
				if (newScale > 2) newScale = 2;
				if (draggingScale) {
					ABPInst.commentScale = newScale;
					updateScale(ABPInst.commentScale);
				} else {
					ABPInst.barScaleHitArea.tooltip(parseInt(newScale * 100) + "%");
				}
			});
			hoverTooltip(ABPInst.barScaleHitArea, true, -6);
			/*Copy from scale bar*/
			var draggingSpeed = false;
			ABPInst.barSpeedHitArea[addEventListener]("mousedown", function(e) {
				draggingSpeed = true;
			});
			ABPInst.barSpeed.style.width = (ABPInst.commentSpeed - 0.5) / 1.5 * 100 + "%";
			var updateSpeed = function(speed) {
				ABPInst.barSpeed.style.width = (speed - 0.5) / 1.5 * 100 + "%";
				ABPInst.barSpeedHitArea.tooltip(parseInt(speed * 100) + "%");
				ABPInst.cmManager.setBounds();
				saveConfigurations();
			}
			document[addEventListener]("mouseup", function(e) {
				if (draggingSpeed) {
					var newSpeed = 0.5 + 1.5 * (e.clientX - ABPInst.barSpeedHitArea.getBoundingClientRect().left) / ABPInst.barSpeedHitArea.offsetWidth;
					if (newSpeed < 0.5) newSpeed = 0.5;
					if (newSpeed > 2) newSpeed = 2;
					ABPInst.commentSpeed = newSpeed;
					updateSpeed(ABPInst.commentSpeed);
					saveSetting.speed();
				}
				draggingSpeed = false;
			});
			document[addEventListener]("mousemove", function(e) {
				var newSpeed = 0.5 + 1.5 * (e.clientX - ABPInst.barSpeedHitArea.getBoundingClientRect().left) / ABPInst.barSpeedHitArea.offsetWidth;
				if (newSpeed < 0.5) newSpeed = 0.5;
				if (newSpeed > 2) newSpeed = 2;
				if (draggingSpeed) {
					ABPInst.commentSpeed = newSpeed;
					updateSpeed(ABPInst.commentSpeed);
				} else {
					ABPInst.barSpeedHitArea.tooltip(parseInt(newSpeed * 100) + "%");
				}
			});
			hoverTooltip(ABPInst.barSpeedHitArea, true, -6);
			/*Speed add finish*/
			ABPInst.btnPlay[addEventListener]("click", function() {
				if (ABPInst.video.paused) {
					ABPInst.video.play();
					this.className = "button ABP-Play ABP-Pause icon-pause";
					this.tooltip(ABP.Strings.pause);
				} else {
					ABPInst.video.pause();
					this.className = "button ABP-Play icon-play";
					this.tooltip(ABP.Strings.play);
				}
			});
			playerUnit[addEventListener]("keydown", function(e) {
				if (e && document.activeElement.tagName != "INPUT") {
					if([27,32,37,38,39,40].indexOf(e.keyCode)!=-1)
						e.preventDefault();
					switch (e.keyCode) {
						case 27:
							if(abpinst.state.fullscreen)
								abpinst.btnFull.click();
						break;
						case 32:
							ABPInst.btnPlay.click();
							break;
						case 37:
							var newTime = ABPInst.video.currentTime -= 5 * ABPInst.video.playbackRate;
							ABPInst.cmManager.clear();
							if (newTime < getBuffer(ABPInst.video).start) newTime = getBuffer(ABPInst.video).start;
							ABPInst.video.currentTime = newTime.toFixed(3);
							if (ABPInst.video.paused) ABPInst.btnPlay.click();
							updateTime(video.currentTime);
							ABPInst.barTimeHitArea.tooltip(formatTime(video.currentTime));
							break;
						case 39:
							var newTime = ABPInst.video.currentTime += 5 * ABPInst.video.playbackRate;
							ABPInst.cmManager.clear();
							if (newTime > getBuffer(ABPInst.video).end) newTime = getBuffer(ABPInst.video).end-1;
							ABPInst.video.currentTime = newTime.toFixed(3);
							if (ABPInst.video.paused) ABPInst.btnPlay.click();
							updateTime(video.currentTime);
							ABPInst.barTimeHitArea.tooltip(formatTime(video.currentTime));
							break;
						case 38:
							var newVolume = ABPInst.video.volume + .1;
							if (newVolume > 1) newVolume = 1;
							ABPInst.video.volume = newVolume.toFixed(3);
							updateVolume(ABPInst.video.volume);
							break;
						case 40:
							var newVolume = ABPInst.video.volume - .1;
							if (newVolume < 0) newVolume = 0;
							ABPInst.video.volume = newVolume.toFixed(3);
							updateVolume(ABPInst.video.volume);
							break;
					}
				}
			});
			playerUnit[addEventListener]("mouseup", function() {
				if (document.activeElement.tagName != "INPUT") {
					var oSY = window.scrollY;
					ABPInst.videoDiv.focus();
					window.scrollTo(window.scrollX, oSY);
				}
			});
		}
		/** Create a bound CommentManager if possible **/
		if (typeof CommentManager !== "undefined") {
			if (ABPInst.state.autosize) {
				var autosize = function() {
					if (video.videoHeight === 0 || video.videoWidth === 0) {
						return;
					}
					var aspectRatio = video.videoHeight / video.videoWidth;
					// We only autosize within the bounds
					var boundW = playerUnit.offsetWidth;
					var boundH = playerUnit.offsetHeight;
					var oldASR = boundH / boundW;

					if (oldASR < aspectRatio) {
						playerUnit.style.width = (boundH / aspectRatio) + "px";
						playerUnit.style.height = boundH + "px";
					} else {
						playerUnit.style.width = boundW + "px";
						playerUnit.style.height = (boundW * aspectRatio) + "px";
					}

					ABPInst.cmManager.setBounds();
				};
				video[addEventListener]("loadedmetadata", autosize);
				autosize();
			}
		}
		/*
		Connect WebSocket
		*/
		shield.init(ABPInst);
		shield.shield();
		dots.init({
			id:'dots',
			width:'100%',
			height:'100%',
			r:16,
			thick:4
		});
		return ABPInst;
	}
})();
