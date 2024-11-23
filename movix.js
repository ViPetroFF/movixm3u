//
//  Copyright (C) 2023 Viktor PetroFF
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy 
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights 
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
//  copies of the Software, and to permit persons to whom the Software is 
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in 
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
//  THE SOFTWARE.
//
//

function OnPlaylistHref(hls, filename) {
	ShowDownloadLink(hls, getFileNameAndReplace(hls, filename));
}

function OnPlaylistHrefHQ(hls, filename) {
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onload = function() {OnPlaylistDownloaded(this, filename);}
	xmlhttp.onerror = () => ShowNotAvaible();
	xmlhttp.open("GET", hls);
	xmlhttp.send();
}

function OnPlaylistHrefHQEx(hls, filename) {
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onload = function() {OnPlaylistDownloadedEx(this, filename);}
	xmlhttp.onerror = () => ShowNotAvaible();
	xmlhttp.open("GET", hls);
	xmlhttp.send();
}

function OnPlaylistDownloaded(xhttp, filename) {
	CheckHttpStatus(PlaylistDownloaded, xhttp, filename);
}

function OnPlaylistDownloadedEx(xhttp, filename) {
	CheckHttpStatus(PlaylistDownloadedEx, xhttp, filename);
}

function OnPalylistVitrina(xhttp, filename) {
	CheckHttpStatus(PalylistVitrina, xhttp, filename);
}

function OnPlaylistDebug() {
	const resp = JSON.parse(this.responseText);
	console.log(this.responseText);
	console.log(resp.url);
}

function PlaylistDownloaded(xhttp, filename) {
	//console.log("result: "+xhttp.responseText);
	const strPlaylst = fixMasterList(xhttp.responseText);
	ShowDataDownloadLink(strPlaylst, getFileNameAndReplace(xhttp.responseURL, filename));
}

function PlaylistDownloadedEx(xhttp, filename) {
	//console.log("result: "+xhttp.responseText);
	let strPlaylst = "#EXTM3U\n";
	strPlaylst += `#EXTINF:-1,${filename}\n`;
	strPlaylst += xhttp.responseURL+"\n";
	let url = ExtractStreamUrl(xhttp.responseText);
	if(url.length > 0 && url.at(0)=='h') {
		strPlaylst += `#EXTINF:-1,${filename} HQ\n`;
		strPlaylst += url+"\n";
	}
	ShowDataDownloadLink(strPlaylst, getFileNameAndReplace(xhttp.responseURL, filename));
}

function PalylistVitrina(xhttp, filename) {
	let strUrl = GetVitrinaSource(xhttp.responseText);
	let strDrm = GetVitrinaDRMServer(xhttp.responseText);
	strUrl = strUrl.replace("{{APPLICATION_ID}}", "");
	strUrl = strUrl.replace("{{CONFIG_CHECKSUM_SHA256}}", "");
	strUrl = strUrl.replace("{{PLAYER_REFERER_HOSTNAME}}", document.location.hostname);
	let urlPlayer = new URL(xhttp.responseURL);
	urlPlayer.searchParams.set("href", strUrl);
	urlPlayer.searchParams.set("drm", strDrm);
	urlPlayer.searchParams.set("name", filename);
	ShowDonloadLink(urlPlayer, filename+".html");
}

function ShowDownloadLink(url, filename) {
	let hrefNode = document.createElement("a");
	hrefNode.href = url;
	hrefNode.download = filename;
	hrefNode.innerText = "Download playlist";
	let newNode = document.createElement("div");
	newNode.className = "video-player__header-bottom";
	newNode.appendChild(hrefNode);
	header_bottom = document.getElementsByClassName(newNode.className)[0];
	header_bottom.parentElement.appendChild(newNode);
}

function ShowDataDownloadLink(playlst, filename) {
	newNode = document.createElement("div");
	hrefNode = document.createElement("a");
	hrefNode.id = "hls11";
	hrefNode.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(playlst);
	hrefNode.download = filename;
	hrefNode.innerText = "Download playlist '" + filename + "'";
	newNode.className = "video-player__header-bottom";
	newNode.appendChild(hrefNode);
	header_bottom = document.getElementsByClassName(newNode.className)[0];
	header_bottom.parentElement.appendChild(newNode);
}

function ShowNotAvaible() {
	const textNode = document.createTextNode("Download not avaible");
	const newNode = document.createElement("div");
	newNode.className = "video-player__header-bottom";
	newNode.appendChild(textNode);
	const header_bottom = document.getElementsByClassName(newNode.className)[0];
	header_bottom.parentElement.appendChild(newNode);
}

function ShowAccessDenied() {
	const textNode = document.createTextNode("Access to the channel is denied");
	const newNode = document.createElement("div");
	newNode.className = "video-player__header-bottom";
	newNode.appendChild(textNode);
	const header_bottom = document.getElementsByClassName(newNode.className)[0];
	header_bottom.parentElement.appendChild(newNode);
}

function ShowVersionInfo() {
	var manifest = chrome.runtime.getManifest();
	const textNode = document.createTextNode("Extension: \"" + manifest.name + "\", Version: " + manifest.version);
	const newNode = document.createElement("div");
	newNode.className = "text text--page-desc h-fz--24 h-mt--40 h-lh--38 h-fz--b-tablet-20 h-lh--b-tablet-32 h-mt--b-tablet-30 h-fz--mobile-16 h-lh--mobile-26";
	newNode.appendChild(textNode);
	const text_page = document.getElementsByClassName(newNode.className)[0];
	text_page.parentElement.insertBefore(newNode, text_page);
}

function OnNotAvaible() {
	console.log("Network failure.");
	ShowNotAvaible();
}

function OnNotAvaible(status, message) {
	console.log("HTTP error: status="+status+", "+message);
	ShowNotAvaible();
}

function CheckHttpStatus(handler, xhttp, filename) {
	switch (xhttp.status) {
		case 200:
			handler(xhttp, filename);
			break;
		case 404:
			const strName = getFileName(xhttp.responseURL);
		    	console.log("File '" + strName + "' not found.");
		default:
			ShowNotAvaible(xhttp.status, xhttp.statusText);
	}
}

function fixMasterList(textM3U) {
	let strM3U = textM3U;
	let ndx = textM3U.indexOf("track_2");
	if(ndx > 0) {
		strM3U = textM3U.replace("track_2", "track_3");
	} else {
		strM3U = textM3U.replace("track_1", "track_2");
	}

	return strM3U;
}

function ExtractStreamUrl(textM3U)
{
	const arrLines = textM3U.split("\n");
	let strM3U = arrLines[0];
	let res=arrLines.filter((object) => object.indexOf("track.m3u8")>0);
	if(res.length > 0) {
		strM3U = res[res.length-1];
		let ndx = strM3U.indexOf("track_2");
		if(ndx > 0) {
			strM3U = strM3U.replace("track_2", "track_3");
		} else {
			strM3U = strM3U.replace("track_1", "track_2");
		}
	}

	return strM3U;
}

function getFileName(url) {
	let strRet = url;
	let ndx = url.lastIndexOf("/");
	if(ndx >= 0) {
		strRet = url.slice(ndx+1);
	}

	return strRet;
}

function getFileNameAndReplace(url, filename) {
	const strName = getFileName(url);
	const arrName = strName.split(".");

	return strName.replace(arrName[0], filename);
}

function getHLSByID(array, id) {
	let res=array.filter((object) => object.id == id);
	let hls=res[0].urls.filter((object) => object.category == "hls");
	//console.log("(" + id + ") " + "hls expires in " + new Date(hls[0].time_expired*1000).toLocaleString());

	return hls[0].url;
}

function getVitrinaByID(array, id) {
	let res=array.filter((object) => object.id == id);
	let vitrina=res[0].urls.filter((object) => object.category == "vitrina_tv");
	//console.log("(" + id + ") " + "vitrina tv expires in " + new Date(vitrina[0].time_expired*1000).toLocaleString());

	return vitrina[0].url;
}

function GetVitrinaDRMServer(textHtml) {
	let strServerURL;
	let ndx = textHtml.indexOf("api:");
	if(ndx > 0) { ndx = textHtml.indexOf("drm:", ndx+1); }
	if(ndx > 0) {
		ndy = textHtml.indexOf("},", ndx+1);
		if(ndy > 0) {
			strApiJson = textHtml.substring(ndx+4, ndy+1).trim();
			strApiJson = strApiJson.replaceAll("'", "\"");
			strApiJson = strApiJson.replace(/(type|url|mpdp|hlsp|(server|license|certificate)URL)(?=:)/g, "\"$&\"");
			//console.log("ApiJson: "+strApiJson);
			strServerURL = JSON.parse(strApiJson).mpdp[0].serverURL;
		}
	}

	return strServerURL;
}

function GetVitrinaSource(textHtml) {
	let strSource;
	let ndx = textHtml.indexOf("api:");
	if(ndx > 0) { ndx = textHtml.indexOf("sources:", ndx+1); }
	if(ndx > 0) {
		ndy = textHtml.indexOf("},", ndx+1);
		if(ndy > 0) {
			strApiJson = textHtml.substring(ndx+8, ndy+1).trim();
			strApiJson = strApiJson.replaceAll("'", "\"");
			strApiJson = strApiJson.replace(/(type|url)(?=:)/g, "\"$&\"");
			//console.log("ApiJson: "+strApiJson);
			strSource = JSON.parse(strApiJson).url;
		}
	}

	return strSource;
}


//
//  Copyright (C) 2019 Carlos Delgado
//  Senior Software Engineer at EPAM Anywhere.
//
//https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
//
function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();
	//element.addEventListener("click", OnClickDownloadList);
	document.body.removeChild(element);
}

function OnMainVitrina(strVUrl, channelName) {
	//console.log("result: "+strVUrl);
	const xmlhttp = new XMLHttpRequest();
	xmlhttp.onload = function() {OnPalylistVitrina(this, channelName);}
	xmlhttp.onerror = () => ShowNotAvaible();
	xmlhttp.open("GET", strVUrl);
	xmlhttp.send();
}

function MainVitrina() {
	const OnMainFunc = OnMainVitrina;
	OnMainFunc(getVitrinaByID(channels, pagePropsData.channelId), strChannelName);
}

function MainHLS() {
	const OnPlaylistHrefFunc = OnPlaylistHrefHQEx;
	var isAccessDenied = (document.getElementsByClassName("video-player-locked").length > 0);
	if(isAccessDenied){
		ShowAccessDenied();
	} else {
		strHLS = getHLSByID(channels, pagePropsData.channelId).replace("http:", "https:");
		OnPlaylistHrefFunc(strHLS, strChannelName);
	}
}

function Main() {
	//MainVitrina();
	MainHLS();
}

function timeoutMain(trying) {
	var isRoot = (document.URL.endsWith("/television"));
	var isComplete = (document.getElementsByClassName("video-player__header-bottom").length > 0);

	if(isRoot){
		ShowVersionInfo();
	} else if( isComplete ){
		Main();
	} else if(trying < 9){
		setTimeout(timeoutMain, 500, trying + 1);
	}
}

function MainAfterPageLoaded() {
	if (document.readyState == "complete") {
		timeoutMain(0);
	} else {
		document.addEventListener("readystatechange", (event) => {
			if (event.target.readyState == "complete") timeoutMain(0);
			});
	}
}


const strChannelsJson=localStorage.getItem("/er/billing/channel_list/url");
//console.log("url: "+strChannelsJson);
const response = JSON.parse(strChannelsJson).value;
//console.log("result: "+response.result);
const channels=response.collection;
let userdataElement = document.getElementById("__NEXT_DATA__");
let userdataJson = userdataElement.firstChild.nodeValue;
//console.log("userdataElement: "+userdataJson);
const userData = JSON.parse(userdataJson);
const pagePropsData = userData.props.pageProps.data;
const strChannelName = userData.query.slug;
//console.log("channelId: "+pagePropsData.channelId);
MainAfterPageLoaded();