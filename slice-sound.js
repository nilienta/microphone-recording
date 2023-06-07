export const sliceSound = (duration, audioBuffer, audioContext) => {
  const segmentLength = audioBuffer.sampleRate * duration;
  const audioLengthSeconds = audioBuffer.duration;
  const chunkCount = Math.ceil(audioLengthSeconds / duration);
  const audioChunks = [];

  for (let i = 0; i < chunkCount; i++) {
    const start = i * 6;
    const end = start + 6;
    const chunkBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      segmentLength,
      audioBuffer.sampleRate
    );
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const chunkChannelData = audioBuffer
        .getChannelData(channel)
        .slice(audioContext.sampleRate * start, audioContext.sampleRate * end);
      chunkBuffer.copyToChannel(chunkChannelData, channel);
    }
    const source = audioContext.createBufferSource();
    source.buffer = chunkBuffer;
    audioChunks.push(source);
  }
  return audioChunks;
};
