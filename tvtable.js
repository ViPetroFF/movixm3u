//
//  Copyright (C) 2024 Viktor PetroFF
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

class HttpError extends Error {
	constructor(response) {
		super(`${response.status} for ${response.url}`);
		this.name = 'HttpError';
		this.response = response;
	}
}

function isHLSCategory(entry) {
  return entry.category == "hls" || entry.category == "hls_mcast_local";
}

function getHLSMap(array) {
	let res = new Map();
	let timeexpires, lastid;
	for (let pos in array) {
		let val = array[pos];
		let hls=val.urls.filter(isHLSCategory);
		if(hls.length > 0) {
			//hls.sort((a, b) => {
			  //const nameA = a.category;//a.name.toUpperCase(); // ignore upper and lowercase
			  //const nameB = b.category;//b.name.toUpperCase(); // ignore upper and lowercase
			  //if (nameA < nameB) {
				//return -1;
			  //}
			  //if (nameA > nameB) {
				//return 1;
			  //}
			  // names must be equal
			  //return 0;
			//});
			res.set(val.id, hls.at(-1).url);
			//timeexpires = hls.at(-1).time_expired;
			//lastid = val.id;
		}
	}

	//console.log("(" + lastid + ") " + "hls expires in " + new Date(timeexpires*1000).toLocaleString());

	return res;
}

function isHLSSupported(entry) {
  return entry.type == "hls" || entry.type == "hls_mcast_local";
}

function getCategoryList(array, category, type) {
	res = new Array();
	switch (type) {
		case "14":
			res=array.filter((object) => object.available.type != "not-available"&&object.resources.some(isHLSSupported)&&object.categories.some((entry) => entry.id == category));
			//res=array.filter((object) => object.categories.some((entry) => entry.id == category));
			break;
		case "channel-packages":
			res=array.filter((object) => object.available.type != "not-available"&&object.resources.some(isHLSSupported)&&object.packages.some((entry) => entry.id == category));
			//res=array.filter((object) => object.packages.some((entry) => entry.id == category));
			break;
		default:
			ShowNotAvailable();
	}

	return res;
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

async function DownloadM3U(url) {
	let response = await fetch(url);

	if (!response.ok) {
		throw new HttpError(response);
	}

	let text = await response.text();

	return text;
}

function getFileName(url) {
	let strRet = url;
	let ndx = url.lastIndexOf("/");
	if(ndx >= 0) {
		strRet = url.slice(ndx+1);
	}

	return strRet;
}

function ShowNotAvailable() {
	const textNode = document.createTextNode("Download not available");
	const newNode = document.createElement("div");
	newNode.className = "footer__contact";
	newNode.appendChild(textNode);
	footer_contact = document.getElementsByClassName(newNode.className)[0];
	footer_contact.parentElement.replaceChild(newNode, footer_contact);
}

function OnNotAvailable() {
	console.log("Network failure.");
	ShowNotAvailable();
}

function OnNotAvailable(status, message) {
	console.log("HTTP error: status="+status+", "+message);
	ShowNotAvailable();
}

function CheckHttpStatus(response) {
	switch (response.status) {
		case 404:
			const strName = getFileName(response.url);
		    console.log("File '" + strName + "' not found.");
		default:
			ShowNotAvailable(response.status, response.statusText);
	}
}

function PlaylistDownloaded(strPlaylst, filename) {
	newNode = document.createElement("div");
	hrefNode = document.createElement("a");
	hrefNode.id = "hls11";
	hrefNode.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(strPlaylst);
	hrefNode.download = filename + ".m3u8";
	hrefNode.innerText = "Download playlist of '" + filename + "'";
	newNode.className = "footer__contact";
	newNode.appendChild(hrefNode);
	footer_contact = document.getElementsByClassName(newNode.className)[0];
	footer_contact.parentElement.replaceChild(newNode, footer_contact);
}

async function Main(playlist, map) {
	strListm3u = "#EXTM3U\n";
	try {
	for (const channel of playlist) {
		url = map.get(channel.id);
		let text = await DownloadM3U(url.replace("http:", "https:"));
		//url = url.replace("http:", "https:");
		strListm3u += `#EXTINF:-1 id=${channel.id},${channel.title}\n`;
		strListm3u += url+"\n";
		url = ExtractStreamUrl(text);
		if(url.length > 0 && url.at(0)=='h') {
			strListm3u += `#EXTINF:-1 id=${channel.id},${channel.title} HQ\n`;
			strListm3u += url+"\n";
		}
		//console.log(text.slice(0, 100) + "...");
	}
	} catch(err) {
		if (err instanceof HttpError) {
			CheckHttpStatus(err.response);
		} else {
			// неизвестная ошибка, пробрасываем её
			throw err;
		}
	}
	//console.log(strListm3u);
	title_category = document.getElementsByClassName("tabs__title-text")[0];
	PlaylistDownloaded(strListm3u, title_category.textContent.replace(/ /g, "_"));
}


const strChannelsHLSJson=localStorage.getItem("/er/billing/channel_list/url");
const strChannelsApiJson=localStorage.getItem("/api/v3/channels");
const typeCategory=localStorage.getItem("channels_folder");
const numCategory=parseInt(localStorage.getItem("channels_category"));
//console.log("hls: "+strChannelsHLSJson);
//console.log("api: "+strChannelsApiJson);
const listHLS = JSON.parse(strChannelsHLSJson).value.collection;
const listApi = JSON.parse(strChannelsApiJson).value.data;
const mapHls = getHLSMap(listHLS);
const lstCategory = getCategoryList(listApi, numCategory, typeCategory);
if(lstCategory.length > 0){
	Main(lstCategory, mapHls);
} else {
	ShowNotAvailable();
}
