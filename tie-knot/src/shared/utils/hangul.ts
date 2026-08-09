export const isChosungOnly = (keyword: string) =>
  /^[ㄱ-ㅎ]+$/.test(keyword.trim());

export const getChosung = (text: string) =>
  text.replace(/[가-힣]/g, (char) => {
    const CHO_SOUND = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
    const code = char.charCodeAt(0) - 0xac00;
    // 초성은 588(중성*종성 조합 개수) 단위로 변한다
    return CHO_SOUND[Math.floor(code / 588)];
  });
