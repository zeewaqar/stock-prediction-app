export async function POST(req: Request) {
    const { symbol } = await req.json();
    const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${process.env.ALPHA_API_KEY}`);
    const data = await response.json();
    return Response.json(data);
  }
  