export async function GET(req: Request) {
  // const { address } = req.url;
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const REST_API_KEY = process.env.KAKAO_REST_API_KEY;

  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/address?query=${address}`,
    {
      headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
    },
  );

  const data = await response.json();

  return Response.json(data);
}
