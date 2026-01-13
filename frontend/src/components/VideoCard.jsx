import React from 'react';
import { FaInstagram, FaPlay, FaExternalLinkAlt } from 'react-icons/fa';

const VideoCard = ({ video }) => {
  if (video.type === 'instagram') {
    return (
      <a 
        href={video.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="card bg-base-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer block"
      >
        {/* Thumbnail with gradient overlay */}
        <div className="aspect-[9/16] w-full relative bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
          {video.thumbnail ? (
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <FaInstagram className="text-6xl mb-4 mx-auto opacity-80" />
                <p className="text-sm opacity-70">點擊觀看 Reel</p>
              </div>
            </div>
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <FaPlay className="text-pink-500 text-2xl ml-1" />
            </div>
          </div>

          {/* Instagram badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md">
            <FaInstagram className="text-pink-500 text-lg" />
          </div>
        </div>

        {/* Card footer */}
        <div className="p-3 bg-base-100 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors flex-1">
            {video.title}
          </h3>
          <FaExternalLinkAlt className="text-base-content/40 text-xs flex-shrink-0 group-hover:text-primary" />
        </div>
      </a>
    );
  }

  // Default YouTube/other video embed
  return (
    <div className="card bg-base-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-[9/16] w-full relative bg-black">
        <iframe 
          className="w-full h-full absolute top-0 left-0"
          src={video.url} 
          title={video.title}
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
      <div className="p-4 bg-base-100">
        <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{video.title}</h3>
      </div>
    </div>
  );
};

export default VideoCard;
