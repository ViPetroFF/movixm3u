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

function OnStreamslistDownloadedHLS(xhttp, filename, drmServ) {
	CheckHttpStatus(StreamslistDownloadedHLS, xhttp, filename, drmServ);
}

function OnStreamslistDownloadedDASH(xhttp, filename, drmServ) {
	CheckHttpStatus(StreamslistDownloadedDASH, xhttp, filename, drmServ);
}

function OnPalylistDownloaded(xhttp, filename) {
	CheckHttpStatus(PalylistDownloaded, xhttp, filename);
}


function StreamslistDownloadedHLS(xhttp, filename, drmServ) {
	let resp = xhttp.response;
	//console.log("drm: "+drmServ);
	xhttp.onload = function() {OnPalylistDownloaded(this, filename);}
	xhttp.open("GET", resp.hls[0]);
	xhttp.responseType = "";
	xhttp.send();
}

function StreamslistDownloadedDASH(xhttp, filename, drmServ) {
	const strDashPlayer = "https://reference.dashif.org/dash.js/nightly/samples/dash-if-reference-player/index.html";
	//const strDashSearch = "?mpd={{MDP_URL}}&autoLoad=true&widevine.isActive=true&widevine.drmKeySystem=com.widevine.alpha&widevine.licenseServerUrl={{DRM_SRV}}";
	let urlPlayer = new URL(strDashPlayer);
	let resp = xhttp.response;
	urlPlayer.searchParams.set("mpd", resp.mpdp[0]);
	urlPlayer.searchParams.set("autoLoad", true);
	urlPlayer.searchParams.set("widevine.isActive", true);
	urlPlayer.searchParams.set("widevine.drmKeySystem", "com.widevine.alpha");
	urlPlayer.searchParams.set("widevine.licenseServerUrl", drmServ);

	document.location.href = urlPlayer;
}

function PalylistDownloaded(xhttp, filename) {
	url = new URL(xhttp.responseURL);
	//console.log("url: "+ url);
	const strPlaylst = fixMasterList(xhttp.responseText, url.origin + url.pathname);
	strName = getFileNameAndReplace(url.pathname, filename);
	download(strName, strPlaylst);
	ShowDownloadComplete(strName);
}

function ShowDownloadComplete(filename) {
	const textNode = document.createTextNode(filename + " downloaded successfully");
	const newNode = document.createElement("div");
	newNode.className = "eump-error";
	newNode.appendChild(textNode);
	const header_bottom = document.getElementsByClassName(newNode.className)[0];
	header_bottom.parentElement.insertBefore(newNode, header_bottom.parentElement.children[0]);
	//header_bottom.parentElement.appendChild(newNode);
	//header_bottom.insertBefore(newNode, header_bottom.children[0]);
}

function ShowNotAvaible() {
	const textNode = document.createTextNode("Download not avaible");
	const newNode = document.createElement("div");
	newNode.className = "eump-error";
	newNode.appendChild(textNode);
	const header_bottom = document.getElementsByClassName(newNode.className)[0];
	header_bottom.parentElement.insertBefore(newNode, header_bottom.parentElement.children[0]);
	//header_bottom.parentElement.appendChild(newNode);
	//header_bottom.insertBefore(newNode, header_bottom.children[0]);
}

function OnNotAvaible() {
	console.log("Network failure.");
	ShowNotAvaible();
}

function OnNotAvaible(status, message) {
	console.log("HTTP error: status="+status+", "+message);
	ShowNotAvaible();
}

function CheckHttpStatus(handler, xhttp, filename, drm) {
	switch (xhttp.status) {
		case 200:
			handler(xhttp, filename, drm);
			break;
		case 404:
			const strName = getFileName(xhttp.responseURL);
		    	console.log("File '" + strName + "' not found.");
		default:
			ShowNotAvaible(xhttp.status, xhttp.statusText);
	}
}

function fixMasterList(textM3U, path) {
	let strM3U = textM3U.trim();
	let strPath = path;
	let ndx = strPath.lastIndexOf("/");
	if(ndx >= 0) {
		strPath = strPath.slice(0, ndx+1);
	}
	strM3U = strM3U.replaceAll("\n", "\n//");
	strM3U = strM3U.replaceAll("//#", "#");
	strM3U = strM3U.replaceAll("//", strPath);

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


//console.log("url: "+document.URL);
let urlDoc = new URL(document.URL);
let url = new URL(urlDoc.searchParams.get("href"));
let drm = new URL(urlDoc.searchParams.get("drm"));
const strFileName = urlDoc.searchParams.get("name");
let xmlhttp = new XMLHttpRequest();
//xmlhttp.onload = function() {OnStreamslistDownloadedDASH(this, strFileName, drm);}
xmlhttp.onload = function() {OnStreamslistDownloadedHLS(this, strFileName, drm);}
xmlhttp.onerror = () => ShowNotAvaible();
xmlhttp.open("GET", url);
xmlhttp.responseType = "json";
xmlhttp.send();
