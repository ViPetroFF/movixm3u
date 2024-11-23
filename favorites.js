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

class HttpError extends Error {
	constructor(response) {
		super(`${response.status} for ${response.url}`);
		this.name = 'HttpError';
		this.response = response;
	}
}

function getHLSMap(array) {
	let res = new Map();
	let timeexpires, lastid;
	for (let pos in array) {
		let val = array[pos];
		let hls=val.urls.filter((object) => object.category == "hls");
		if(hls.length > 0) {
			res.set(val.id, hls[0].url);
			timeexpires = hls[0].time_expired;
			lastid = val.id;
		}
	}

	//console.log("(" + lastid + ") " + "hls expires in " + new Date(timeexpires*1000).toLocaleString());

	return res;
}

function getFavoritesList(array) {
	let res=array.filter((object) => object.available.type != "not-available" && object.favorite.type == "favorite");

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

function ShowNotAvaible() {
	const textNode = document.createTextNode("Download not avaible");
	const newNode = document.createElement("section");
	newNode.className = "info info--compact";
	newNode.appendChild(textNode);
	header_bottom = document.getElementsByClassName(newNode.className)[0];
	header_bottom.appendChild(newNode);
}

function OnNotAvaible() {
	console.log("Network failure.");
	ShowNotAvaible();
}

function OnNotAvaible(status, message) {
	console.log("HTTP error: status="+status+", "+message);
	ShowNotAvaible();
}

function CheckHttpStatus(response) {
	switch (response.status) {
		case 404:
			const strName = getFileName(response.url);
		    	console.log("File '" + strName + "' not found.");
		default:
			ShowNotAvaible(response.status, response.statusText);
	}
}

function PlaylistDownloaded(strPlaylst) {
	newNode = document.createElement("section");
	hrefNode = document.createElement("a");
	hrefNode.id = "hls11";
	hrefNode.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(strPlaylst);
	hrefNode.download = "favorites.m3u8";
	hrefNode.innerText = "Download playlist of favorites";
	newNode.className = "info info--compact";
	newNode.appendChild(hrefNode);
	header_bottom = document.getElementsByClassName(newNode.className)[0];
	header_bottom.appendChild(newNode);
}

async function Main(favorites, map) {
	strFavoritesm3u = "#EXTM3U\n";
	try {
	for (const channel of favorites) {
		url = map.get(channel.id);
		let text = await DownloadM3U(url.replace("http:", "https:"));
		//url = url.replace("http:", "https:");
		strFavoritesm3u += `#EXTINF:-1 id=${channel.id},${channel.title}\n`;
		strFavoritesm3u += url+"\n";
		url = ExtractStreamUrl(text);
		if(url.length > 0 && url.at(0)=='h') {
			strFavoritesm3u += `#EXTINF:-1 id=${channel.id},${channel.title} HQ\n`;
			strFavoritesm3u += url+"\n";
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

	PlaylistDownloaded(strFavoritesm3u);
}


const strChannelsHLSJson=localStorage.getItem("/er/billing/channel_list/url");
const strChannelsApiJson=localStorage.getItem("/api/v3/channels");
//console.log("hls: "+strChannelsHLSJson);
//console.log("api: "+strChannelsApiJson);
const listHLS = JSON.parse(strChannelsHLSJson).value.collection;
const listApi = JSON.parse(strChannelsApiJson).value.data;
const mapHls = getHLSMap(listHLS);
const lstFavorites = getFavoritesList(listApi);
Main(lstFavorites, mapHls);
