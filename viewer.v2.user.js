// ==UserScript==
// @name         Sandbox Viewer
// @namespace    https://github.com/vihanb/PPCG-SandboxViewer
// @version      2.0
// @description  PPCG Sandbox Viewer
// @author       Downgoat
// @match        *://*.stackexchange.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

$(document).ready(function() {
  var OPENED = false;
  $("body").prepend('<div id="SandboxViewer" style="display:none; width: inherit; height: inherit;"></div>');
  $("body").prepend('<div id="SandboxPopdisp" style="display: none; z-index: 5; position: fixed; background: rgba(0, 0, 0, 0.75); color: white; top: 50%; left: 50%; line-height: 70px; text-align: center; font-size: 36px; font-weight: bold; height: 70px; width: 120px; border-radius: 8px; transform: translateY(-50%) translateX(-50%);"></div>');
  $('#SandboxViewer').prepend('<div id="SandboxBlur" style="position: fixed;z-index:2;width:100%;height:100%;background:rgba(0,0,0,0.5)"></div>');
  $('#SandboxViewer').append('<div id="SandboxContent" style="position: fixed; overflow: scroll; z-index: 3; width: 90%; max-height: 90%;top: 50%;left: 50%;transform: translateY(-50%) translateX(-50%);background: #FAFAFA;padding: 1em;display: -webkit-flex;display: flex;"><span id="USERLOAD">Loading...</span></div>');

  $(".topbar .topbar-wrapper .network-items").append('<a id="SandboxViewerToggle" class="topbar-icon yes-hover" style="z-index:1;width: 36px; background-image: url(http://i.stack.imgur.com/lBskr.png); background-size: 19px 19px; background-position: 8px 7px"></a>');

  var POSTCOUNTER = 0;

  function PopupDisplay(text) {
    $("#SandboxPopdisp").html(text);
    $("#SandboxPopdisp").fadeIn(200, function () {
      $(this).delay(1000).fadeOut(200);
    });
  }

  function ConstructPost(post) {
    return '<div>' + post.body + '</div>';
  }

  function VotePost(post, state) {
    // States:
    // 2 - Upvote
    // 3 - Downvote
    // 10- Delete
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
  function PostPost(title, body, id) {
    console.log(title, body);
    GM_xmlhttpRequest({
      method: "POST",
      data:"qualityBanWarningShown=False&priorAttemptCount=0&title="+title+"&post-text="+encodeURIComponent(body)+"&fkey=" + StackExchange.options.user.fkey + "&author=&wmd-input-42=&tagnames=" + body.match(/\[tag:[^\]]+/g).map(function(l){return l.slice(5);}).join(","),
      url: "http://codegolf.stackexchange.com/questions/ask/submit/",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      onload:function(response){
        var url  = (response.responseText.match(/<meta property="og:url" content="([^"]+)/)||[])[1];
        var title= $(response.responseText).find("title").text();
        var win = window.open(url, title || "Post From the Sandbox");
        VotePost("http://meta.codegolf.stackexchange.com/posts/" + id, 10);
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
          return '<li><b><a href="' + post.url + '">' + post.title + '</a></b>' +
            '<br><span>score: <span style="color: green;">+' + post.score.up + '</span>'+
            ' <span style="color: red">-' + post.score.down + '</span></span>' +
            '<br><span>active: ' + TimeSince( new Date( +(post.active + 'e3' ) ) ) + ' ago</span>'
          // + '<br><a class="Fmtom" data-postid="'+post.id+'">Post to main</a></li>';
        }).join("\n") + '</ul></div>';

        HTML += '<h1>Latest Activity</h1><div>' + GetComments(posts).map(function(comment) {
          return '<b><a href="' + comment.postlink + '">' + comment.post + '</a></b>, <a href="http://codegolf.stackexchange.com/users/' + comment.userid + '">' + comment.user + '</a>: ' + comment.text + " - <a href=\"" + comment.link + "\">" + FormatDate(new Date( +(comment.timestamp + 'e3') )) + "</a><hr>";
        }).join("") + '</div>';
        $("#SandboxContent").prepend('<div style="width: 38%; -webkit-flex-direction: column; flex-direction: column; overflow: auto;">' + HTML + "</div>");
      });
      GetChallenges("*nofilter*", function(posts) {
        var HTML = "";
        HTML += '<div style="text-align: left; float: left; width: 30%; margin-bottom: 10px;">'+
          '<button class="FLink">See in Sandbox</button> <br><button class="FComment">Comment</button></div>'+
          '<div style="text-align: right; float: right; width: 60%; margin-bottom: 10px;">' +
          '<button id="FPREV" style="display: none">Previous Challenge</button> <button class="sandboxbtn FNEXT">Next</button><button id="FHIDE">Don\'t show this again</button><br>' +
          '<button class="FVoteDown">-1 Challenge</button> <button class="FVoteUp">+1 Challenge</button>' +
          '</div><hr style="background: #DDD; width: 100%;"><div id="SandboxChallengePreview">' + ConstructPost(posts[POSTCOUNTER]) + '</div>';
        $("#SandboxContent").append('<div style="width: 60%; margin-left: 2%; -webkit-flex-direction: column; flex-direction: column; overflow: auto;">' + HTML + '</div>');
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
        $(".FVoteUp").click(function() { PopupDisplay("+1'd"); VotePost("http://meta.codegolf.stackexchange.com/posts/" + posts[POSTCOUNTER].id, 2); });
        $(".FVoteDown").click(function() { PopupDisplay("-1'd"); VotePost("http://meta.codegolf.stackexchange.com/posts/" + posts[POSTCOUNTER].id, 3); });
        $(".FComment").click(function(){ CommentPost("http://meta.codegolf.stackexchange.com/posts/" + posts[POSTCOUNTER].id, prompt("Comment Markdown: ")); });
        $(".FLink").click(function(){ window.open(posts[POSTCOUNTER].url, "_blank"); });
        $(".Fmtom").click(function(){ Request("GET", "http://api.stackexchange.com/2.2/answers/"+$(this).data('postid')+"?order=desc&sort=activity&key=Ccn4VoktkZPX*Haf3)iubw((&site=meta.codegolf&filter=!GeEyUcJFJeRCA", function(response) {
          var res = JSON.parse(response.responseText).items[0].body_markdown;
          PostPost(GetPostTitle(res), res, $(this).data('postid'));
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
  return [d.getMonth() + 1, d.getDate(), d.getYear()+1900].join('/') + ' ' +
    [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()].join(':');
}

function TimeSince(d) {
    var s = Math.floor((new Date() - d) / 1000);
    var interval = Math.floor(s / 31536000);
    if (interval > 1) return interval + " years";
    interval = Math.floor(s / 2592000);
    if (interval > 1) return interval + " months";
    interval = Math.floor(s / 86400);
    if (interval > 1) return interval + " days";
    interval = Math.floor(s / 3600);
    if (interval > 1) return interval + " hours";
    interval = Math.floor(s / 60);
    if (interval > 1) return interval + " minutes";
    return Math.floor(s) + " seconds";
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
        post: post,
        active: post.last_activity_date
      };
    }));
  });
}

function GetUserPosts(userid, callback) {
  var hideitem = JSON.parse(localStorage.getItem("FHIDE") || '[]');
  Request("GET", "https://api.stackexchange.com/2.2/questions/2140/answers?order=desc&sort=activity&key=Ccn4VoktkZPX*Haf3)iubw((&site=meta.codegolf&filter=!-2qNq(tTGQYRU3SZ87hedUU)5htvSK6RNae3(IkBC-M8i", function(req) {
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