import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repoParam = searchParams.get('repo');
  const tokenParam = searchParams.get('token');

  if (!repoParam || !tokenParam) {
    return NextResponse.json({
      success: false,
      error: "Parameter 'repo' dan 'token' wajib disertakan.",
      example: "/api/sync?repo=BeyeDev/web-mili-dev&token=ghp_xxxx"
    }, { status: 400 });
  }

  try {
    // 1. Ambil detail repository dari GitHub API
    const repoResponse = await fetch(`https://api.github.com/repos/${repoParam}`, {
      headers: {
        'Authorization': `token ${tokenParam}`,
        'User-Agent': 'MCK-DevReport-Sync'
      }
    });

    if (!repoResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Gagal mengambil detail repositori. GitHub API merespon dengan status: ${repoResponse.status}`
      }, { status: repoResponse.status });
    }

    const repoData = await repoResponse.json();
    const language = repoData.language || 'None';

    // 2. Ambil 10 commits terbaru dari default branch
    const commitsResponse = await fetch(`https://api.github.com/repos/${repoParam}/commits?per_page=10`, {
      headers: {
        'Authorization': `token ${tokenParam}`,
        'User-Agent': 'MCK-DevReport-Sync'
      }
    });

    if (!commitsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Gagal mengambil list commits. GitHub API merespon dengan status: ${commitsResponse.status}`
      }, { status: commitsResponse.status });
    }

    const commitsData = await commitsResponse.json();

    // 3. Ambil 5 pull requests terbaru
    const prResponse = await fetch(`https://api.github.com/repos/${repoParam}/pulls?state=all&per_page=5`, {
      headers: {
        'Authorization': `token ${tokenParam}`,
        'User-Agent': 'MCK-DevReport-Sync'
      }
    });

    let prsData = [];
    if (prResponse.ok) {
      prsData = await prResponse.json();
    }

    // Return data hasil sinkronisasi
    return NextResponse.json({
      success: true,
      message: `Sinkronisasi repositori '${repoParam}' berhasil!`,
      data: {
        repoName: repoParam,
        language: language,
        defaultBranch: repoData.default_branch,
        private: repoData.private,
        commitsCountFetched: commitsData.length,
        commits: commitsData.map((c: any) => ({
          sha: c.sha.substring(0, 8),
          message: c.commit.message.split('\n')[0],
          author: c.commit.author.name,
          date: c.commit.author.date
        })),
        pullRequests: prsData.map((p: any) => ({
          number: p.number,
          title: p.title,
          state: p.state,
          author: p.user.login,
          createdAt: p.created_at
        }))
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Internal Server Error: ${error.message}`
    }, { status: 500 });
  }
}
