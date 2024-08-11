import {ChatGoogleGenerativeAI} from '@langchain/google-genai';
import MarkdownIt from 'markdown-it';
import './style.css';

// 🔥 SET `GOOGLE_API_KEY` IN YOUR .env FILE! 🔥
// 🔥 GET YOUR GEMINI API KEY AT 🔥
// 🔥 https://g.co/ai/idxGetGeminiKey 🔥

const form = document.querySelector('form');
const promptInput = document.querySelector('input[name="prompt"]');
const output = document.querySelector('.output');
const apiKey = process.env.GOOGLE_API_KEY;

const apiKeyMovie = process.env.MOVIE_API_KEY; // TheMovieDB APIキーを設定してください
const apiUrl = 'https://api.themoviedb.org/3';

async function getMovieDetails(title) {
  try {
    const response = await fetch(`${apiUrl}/search/movie?api_key=${apiKeyMovie}&query=${title}`);
    const data = await response.json();

    if (data.results.length > 0) {

      const h3 = document.querySelectorAll('h3');

      const images = document.querySelectorAll('img');
      const paragraphs = document.querySelectorAll('p');
  
      // 取得した要素を削除します

      h3.forEach(h3 => {
        h3.parentNode.removeChild(h3);
      });

      images.forEach(image => {
        image.parentNode.removeChild(image);
      });
  
      paragraphs.forEach(paragraph => {
        paragraph.parentNode.removeChild(paragraph);
      });

      const movieId = data.results[0].id; 

      // 映画の詳細情報を取得
      const movieDetails = await fetch(`${apiUrl}/movie/${movieId}?api_key=${apiKeyMovie}`);
      const movieData = await movieDetails.json();

      // 画像と概要を取得
      const posterPath = movieData.poster_path; 
      const overview = movieData.overview; 

      // イメージと概要を表示
      const imageElement = document.createElement('img');
      imageElement.src = `https://image.tmdb.org/t/p/w500${posterPath}`;
      imageElement.alt = `${title} のポスター画像`;

      const titleElement = document.createElement('h3');
      titleElement.textContent = `Title : ${title} `;

      const overviewElement = document.createElement('p');
      overviewElement.textContent = overview;

      // イメージと概要を表示する場所を取得 (例：body要素)
      const displayArea = document.querySelector('body'); 
     
      // イメージと概要をDOMに追加
      
      displayArea.appendChild(titleElement);
      displayArea.appendChild(overviewElement);
      displayArea.appendChild(imageElement);

      return { posterPath, overview };
    } else {
      // 映画が見つからない場合のメッセージ
      alert('映画が見つかりませんでした');
      return { posterPath: null, overview: '映画が見つかりませんでした' };
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
    alert('エラーが発生しました');
    return { posterPath: null, overview: 'エラーが発生しました' };
  }
}


// プロンプトを作成する関数
function prompt(promptText) {
  return `
  You are a movie recommendation AI.
  以下のユーザー情報に基づいて、おすすめの映画を１本英語名のタイトルだけおすすめしてください。

  ## ユーザー情報:
  ${promptText}
  `
}

form.onsubmit = async ev => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    // Call the multimodal model, and get a stream of results
    const vision = new ChatGoogleGenerativeAI({
      modelName: 'gemini-1.5-flash', // or gemini-1.5-pro
      apiKey
    });

    // Multi-modal streaming
    const streamRes = await vision.stream(prompt(promptInput.value));

    // Read from the stream and interpret the output as markdown
    const buffer = [];
    const md = new MarkdownIt();

    for await (const chunk of streamRes) {
      buffer.push(chunk.content);
      output.innerHTML = md.render(buffer.join(''));
    }
    
    getMovieDetails(buffer); // 配列の各要素を出力

  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }

};

if (!apiKey) {
  console.error('APIキーが設定されていません。');
  // エラー処理
}