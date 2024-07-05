//words.js - put advertising into the correct boxes

$(document).ready(onReady);

$defaultAd = false;
//$defaultAdURL = "http://blockland.us";
$defaultAdURL = "https://store.steampowered.com/app/250340/";
$defaultAdName = "blockland";

function onReady()
{
   //default ads
   if($(".towerBox").css("display") != "none")
   {
      if($defaultAd)
      {
         $(".towerBox").html("<a href='" + $defaultAdURL + "'><img style='margin-left:45px; margin-top:8px;' src='tower-" + $defaultAdName + ".jpg'></a>");
      }
      else
      {
         $(".towerBox").html("" 
            + "<script async src='//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'></script> "
            + "<ins class='adsbygoogle' "
            + "     style='display:inline-block;width:160px;height:600px; margin-left:45px; margin-top:8px;' "
            + "     data-ad-client='ca-pub-1749926066094511' "
            + "     data-ad-slot='6662605194'></ins> ");
      }
   }

   if($(".posterBox").css("display") != "none")
   {  
      if($defaultAd)
      {
         $(".posterBox").html("<a href='" + $defaultAdURL + "'><img style='margin-left:8px; margin-top:43px;' src='poster-" + $defaultAdName + ".jpg'></a>");
      }
      else
      {
         $(".posterBox").html(""
            + "<script async src='//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'></script> "
            + "<ins class='adsbygoogle' "
            + "     style='display:inline-block;width:336px;height:280px; margin-left:8px; margin-top:43px;' "
            + "     data-ad-client='ca-pub-1749926066094511' "
            + "     data-ad-slot='4627468796'></ins> ");
      }
   }
   
   if($(".mobileBox").css("display") != "none")
   {
      if($defaultAd)
      {
         $(".mobileBox").html("<a href='" + $defaultAdURL + "'><img style='margin-left:0px; margin-top:32px;' src='mobile-" + $defaultAdName + ".jpg'></a>");
      }
      else
      {
         $(".mobileBox").html(""
            + "<script async src='//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'></script> "
            + "<ins class='adsbygoogle' "
            + "     style='display:inline-block;width:468px;height:60px; margin-left:0px; margin-top:32px;' "
            + "     data-ad-client='ca-pub-1749926066094511' "
            + "     data-ad-slot='1534401597'></ins> ");
      }
   }   

   if($(".leaderBox").css("display") != "none")
   {
      if($defaultAd)
      {
         $(".leaderBox").html("<a href='" + $defaultAdURL + "'><img style='margin-left:8px; margin-top:43px;' src='leader-" + $defaultAdName + ".jpg'></a>");
      }
      else
      {
         $(".leaderBox").html(""
            + "<script async src='//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'></script> "
            + "<ins class='adsbygoogle' "
            + "     style='display:inline-block;width:728px;height:90px; margin-left:8px; margin-top:43px;' "
            + "     data-ad-client='ca-pub-1749926066094511' "
            + "     data-ad-slot='5964601193'></ins> ");
      }
   }

   //start the google ad script
   if(!$defaultAd)
   {
      (adsbygoogle = window.adsbygoogle || []).push({});
   }
}