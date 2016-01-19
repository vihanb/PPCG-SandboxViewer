// ==UserScript==
// @name         Sandbox Viewer
// @namespace    https://github.com/vihanb/PPCG-SandboxViewer
// @version      1
// @description  PPCG Sandbox Viewer
// @author       Downgoat
// @require      https://code.jquery.com/jquery-2.2.0.min.js
// @match        *://*.askubuntu.com/*
// @match        *://*.onstartups.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==
$(document).ready(function() {
  var OPENED = false;
  $("body").prepend('<div id="SandboxViewer" style="display:none; width: inherit; height: inherit;"></div>');
  $('#SandboxViewer').prepend('<div id="SandboxBlur" style="position: fixed;z-index:2;width:100%;height:100%;background:rgba(0,0,0,0.5)"></div>');
  $('#SandboxViewer').append('<div id="SandboxContent" style="position: fixed; overflow: scroll; z-index: 3; width: 90%; max-height: 90%;top: 50%;left: 50%;transform: translateY(-50%) translateX(-50%);background: #FAFAFA;padding: 1em;"><span id="USERLOAD">Loading...</span></div>');

  $(".topbar .topbar-wrapper .network-items").append('<a id="SandboxViewerToggle" class="topbar-icon yes-hover" style="z-index:1;width: 36px; background-image: url(http://i.stack.imgur.com/lBskr.png); background-size: 19px 19px; background-position: 8px 7px"></a>');

  var POSTCOUNTER = 0;

  function ConstructPost(post) {
    return '<div>' + post.body + '</div>';
  }

  function VotePost(post, state) {
	// States:
	// 2 - Upvote
    // 3 - Downvote
	// Post: http://<site>.com/posts/<post_id>/vote/<state>
	GM_xmlhttpRequest({
		method: "POST",
		data: "fkey=" + StackExchange.options.user.fkey,
		url: post+"/vote/"+state,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		onload:function(response) {
		}
	});
  }
  function CommentPost(post, comment) {
	  GM_xmlhttpRequest({
		  method: "POST",
		  data: "fkey=" + StackExchange.options.user.fkey + "&comment=" + encodeURIComponent(comment),
		  url: post+"/comments/",
		  headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		  },
		  onload:function(response){
			console.log(response);
		  }
	  });
  }
  function PostPost(title, body) {
	  console.log(title, body);
	  GM_xmlhttpRequest({
		  method: "POST",
		  data:"qualityBanWarningShown=False&priorAttemptCount=0&title="+title+"&post-text="+encodeURIComponent(body)+"&fkey=" + StackExchange.options.user.fkey + "&author=&wmd-input-42=&tagnames=" + body.match(/\[tag:[^\]]+/g).map(function(l){return l.slice(5);}).join(","),
		  url: "http://codegolf.stackexchange.com/questions/ask/submit/",
		  headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		  },
		  onload:function(response){
			  console.log(response);
		      var win = window.open("", "Post From the Sandbox");
		      win.document.write(response.responseText);
		  }
	  });
/*
qualityBanWarningShown=False
priorAttemptCount=0
title=Title
post-text=Post Text
&fkey=6ee389d149f11254dcdb48f1951bde39
author=
N/A - i1l=paJXO3BPSH4DO0J6scE0O0t++dqGmOIuxSBMxRqy4Gs=
tagnames=discussion,code-golf
wmd-input-42=
*/
  }
  $("#SandboxViewerToggle").click(function() {
    $('#SandboxViewer').fadeIn(100);
    if (OPENED === false) {
      OPENED = true;
      GetChallenges(StackExchange.options.user.userId, function(posts) {
        var HTML = "";
        HTML += '<h1>Your Sandboxed Posts</h1><div><ul>' + posts.map(function(post) {
          return '<li><b><a href="' + post.url + '">' + post.title + '</a></b><span>&nbsp;-&nbsp;' + post.score.up + " upvote" + (post.score.up !== 1 ? "s" : "") + "; " + post.score.down + " downvote" + (post.score.down !== 1 ? "s" : "") + '</span> - <a class="Fmtom" data-postid="'+post.id+'">Post to main</a></li>';
        }).join("\n") + '</ul></div>';

        HTML += '<h1>Latest Activity</h1><div>' + GetComments(posts).map(function(comment) {
          return '<b><a href="' + comment.postlink + '">' + comment.post + '</a></b>, <a href="http://codegolf.stackexchange.com/users/' + comment.userid + '">' + comment.user + '</a>: ' + comment.text + " - <a href=\"" + comment.link + "\">" + FormatDate(new Date(comment.timestamp)) + "</a><hr>";
        }).join("") + '</div>';
        $("#SandboxContent").prepend('<div style="width: 38%; float: left">' + HTML + "</div>");
      });
      GetChallenges("*nofilter*", function(posts) {
        var HTML = "";
        HTML += '<div style="text-align: left; float: left; width: 50%; margin-bottom: 10px;">'+
		  '<button id="FPREV" style="display: none">Previous Challenge</button><br><button id="FHIDE">Don\'t show this again</button></div>'+
			
		  '<div style="text-align: right; float: right; width: 50%; margin-bottom: 10px;">' +
          '<button class="sandboxbtn FNEXT">Next</button>' +
          '<button class="sandboxbtn FVoteDown">-1 Challenge</button> <button class="FVoteUp sandboxbtn">+1 Challenge</button><br>' +
		  '<a target="_blank" class="FLink">See in Sandbox</a> <button class="FComment">Comment</button>' +
          '</div><hr style="background: #DDD; width: 100%;"><div id="SandboxChallengePreview">' + ConstructPost(posts[POSTCOUNTER]) + '</div>';
        $("#SandboxContent").append('<div style="width: 60%; float: right">' + HTML + '</div>');
		$(".sandboxbtn").click(function() {
		  $("#SandboxChallengePreview").fadeTo(100, 0, function() {
            setTimeout(function() {
			  $("#SandboxChallengePreview").html(ConstructPost(posts[++POSTCOUNTER]));
			  $("#SandboxChallengePreview").fadeTo(100, 1);
			  if(POSTCOUNTER === 0) $("#FPREV").hide();
			  else $("#FPREV").fadeIn(50);
			}, 200);
		  });
		});
		$("#FPREV").click(function(){
		  $("#SandboxChallengePreview").fadeTo(100, 0, function() {
            setTimeout(function() {
			  $("#SandboxChallengePreview").html(ConstructPost(posts[--POSTCOUNTER]));
			  $("#SandboxChallengePreview").fadeTo(100, 1);
			  if(POSTCOUNTER === 0) $("#FPREV").fadeOut(50);
			  else $("#FPREV").fadeIn(50);
			}, 200);
		  });
		});
		$("#FHIDE").click(function() {
		  var H=JSON.parse(localStorage.getItem("FHIDE") || '[]');
		  H.push(posts[POSTCOUNTER].id);
		  localStorage.setItem("FHIDE", JSON.stringify(H));
		  $(".FNEXT").click();
		});
		$(".FVoteUp").click(function() { VotePost("http://meta.codegolf.stackexchange.com/posts/" + posts[POSTCOUNTER - 1].id, 2); });
		$(".FVoteDown").click(function() { VotePost("http://meta.codegolf.stackexchange.com/posts/" + posts[POSTCOUNTER - 1].id, 3); });
		$(".FComment").click(function(){ CommentPost("http://meta.codegolf.stackexchange.com/posts/" + posts[POSTCOUNTER].id, prompt("Comment Markdown: ")); });
		$(".FLink").click(function(){ window.open(posts[POSTCOUNTER].url, "_blank"); });
		$(".Fmtom").click(function(){ Request("GET", "http://api.stackexchange.com/2.2/answers/"+$(this).data('postid')+"?order=desc&sort=activity&key=Ccn4VoktkZPX*Haf3)iubw((&site=meta.codegolf&filter=!GeEyUcJFJeRCA", function(response) {
			var res = JSON.parse(response.responseText).items[0].body_markdown;
			PostPost(GetPostTitle(res), res);
		}); });
      });
      $("#USERLOAD").remove();
    }
  });

  $('#SandboxBlur').click(function() {
    $('#SandboxViewer').fadeOut(100);
  });
});

/*== Functions ==*/
function FormatDate(d) {
  return [d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
}

function GetComments(posts) {
  return posts.reduce(function(data, post) {
    var comments = post.comments || [];
    comments.forEach(function(cm) {
      data.push({
        timestamp: cm.creation_date,
        user: cm.owner.display_name,
        userid: cm.owner.user_id,
        postlink: post.post.link,
        link: cm.link,
        text: cm.body,
        post: GetPostTitle(post.post.body_markdown)
      });
    });
    data.sort(function(a, b) {
      return b.timestamp - a.timestamp;
    });
    return data;
  }, []);
}

function GetPostTitle(markdown) {
  return (markdown.match(/(?:\n|^)#+(.+)/) || ["", "Unknown Title"])[1];
}

function GetChallenges(userid, callback) {
  GetUserPosts(userid, function(posts) {
    callback(posts.map(function(post) {
      return {
        title: GetPostTitle(post.body_markdown),
        score: {
          up: post.up_vote_count,
          down: post.down_vote_count
        },
        url: post.link,
        comments: post.comments,
		id: post.answer_id,
		body: post.body,
        post: post
      };
    }));
  });
}

function GetUserPosts(userid, callback) {
  var hideitem = JSON.parse(localStorage.getItem("FHIDE") || '[]');
  Request("GET", "https://api.stackexchange.com/2.2/questions/2140/answers?order=desc&sort=activity&key=Ccn4VoktkZPX*Haf3)iubw((&site=meta.codegolf&filter=!9wQs9*rijGfAx8HBVP.bJ21cgRqrG(XCNUCrB__HBm", function(req) {
    var items = JSON.parse(req.response).items;
    callback(items.filter(function(item) {
      return !~hideitem.indexOf(item.answer_id) && (userid == "*nofilter*" ? item.owner.user_id !== StackExchange.options.user.userId : item.owner.user_id === userid);
    }));
  });
}

function Request(type, url, callback) {
  var r = new XMLHttpRequest();
  r.onreadystatechange = function() {
    if (r.readyState === 4)
      if (r.status === 200) callback(r);
  };
  r.open(type, url);
  if (type.toUpperCase() === "POST") r.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  r.send();
}
