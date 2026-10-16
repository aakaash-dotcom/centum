import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const SWAP_79_DATA = {
  "hsc-biology-2022-annual-em": {
    "old": "1q4hSUHRrjdJeDakjBN3D43Iz4kLObgpm",
    "new": "15pobIS7p-mxUJs5LwNCWObH_9_l3gLSq"
  },
  "hsc-botany-2022-annual-em": {
    "old": "131ygS0Uw3ppI5aPs57YnxD9NoDoaqxAI",
    "new": "155mb9mQlCxHlRYNPF1EKxslavekFb_H0"
  },
  "hsc-business-maths-2022-annual-em": {
    "old": "1E90s0ulsv29GWyMnz7QlV6xNoXX82e_S",
    "new": "1kAH3yINLOpFXLw4A2sWns4QiZvylmfJy"
  },
  "hsc-chemistry-2022-annual-em": {
    "old": "1_aJKbkEBHqPF8g49RXBjdV_Qe1JbZ3SB",
    "new": "1OCEs4f2p-YJLCHz7uBudEbfwF_1EJ8Ff"
  },
  "hsc-commerce-2022-annual-em": {
    "old": "1QDbYPt5QdnP-HGAgoWeCdKC8iTZzdmmc",
    "new": "1teiNYPn78S0CNTLJ5atWWvA0ITPKjSSB"
  },
  "hsc-computer-science-2022-annual-em": {
    "old": "1YFdcJmTBgdfz5hRwqaJ1tG-I4y-r3Qw-",
    "new": "1xzl8oMsgAs1XkLIngYS8yUZvxd-Da2_G"
  },
  "hsc-economics-2022-annual-em": {
    "old": "1irYJjHz7hB4tpSA7p970vdzVy5Z48L7a",
    "new": "1Tp53tULdDe5V2WiwuBccm9BvBE_wyVsP"
  },
  "hsc-english-2022-annual-em": {
    "old": "1l5eeg2ZhOe2RoekLCn_GUuFIxjdHufms",
    "new": "1URTjtJEl92mvW_BmKhfQvIzaXSVPjlRX"
  },
  "hsc-french-2022-annual-em": {
    "old": "13hAlLIJZrDKRzCQ0vQmvvyUXXuHMyEKb",
    "new": "1o9eGGkbKwcVmyEUxZkzWuP5x-OYyT_P1"
  },
  "hsc-french-2024-annual-em": {
    "old": "10eTlfhQq0hVukIgvOaYrt8Q6M77WYjbx",
    "new": "1iexRCvWYfyKhjWrnueB7TJQtPtU-kpOF"
  },
  "hsc-french-2025-annual-em": {
    "old": "1YO3ygfosQmXfdNZT7wlrPFOSux6SndSQ",
    "new": "1FD0odx0tHE5-flrAGBdE6jLHwmzxg3Pm"
  },
  "hsc-history-2022-annual-em": {
    "old": "1ucEcnWS866FUr0u_RFI3d2PEa3ju8rQT",
    "new": "1sz4H1C1mc-CWMrqYtOmJCjEMjz9I_FRP"
  },
  "hsc-mathematics-2022-annual-em": {
    "old": "1PSbNn2wgCJC8i9GrAOJ-ElywCAowO-zR",
    "new": "1_0AQU5FehNrTqlGsHb_eMFSZyljGR1Jv"
  },
  "hsc-mathematics-2024-annual-em": {
    "old": "1sllGTfE1N8F8YqDySek0wKzNmkRlgV-4",
    "new": "1_S2YwqeJYtL7tIQgNHBDg-hF32Ct3NpR"
  },
  "hsc-mathematics-2025-annual-em": {
    "old": "1ZvoNn-CLD4mWEGMz0qBIjKJgMulnsz_-",
    "new": "1K3IZhlTlej5-4qd7TpsG1sZulwgLMqyS"
  },
  "hsc-physics-2022-annual-em": {
    "old": "14z23fbA5Y0D48FkRJkfzQBnuHZ0tpwoc",
    "new": "1bor67-bmACmXNuDLdyAzyk_eO-ePGhK7"
  },
  "hsc-political-science-2022-annual-em": {
    "old": "17hwB4R_wR4LL6U7qHMoo5eP8txdqKgoO",
    "new": "1mI7TJr-Qso9yQYHe7x6PB_07PQVBxkZp"
  },
  "hsc-political-science-2024-annual-em": {
    "old": "1QrcCNulze2mRdIHKCiHi0s8-UP2XFguc",
    "new": "12i5Nq913ZgXEAVSSUUnHwc3WaZyKXGAk"
  },
  "hsc-political-science-2025-annual-em": {
    "old": "1Wg_auZJAOSPHj27kVnIEn1LDqUhLR7Az",
    "new": "1295Usqb_t1C8s5lLrsStLDii0RH2TfBB"
  },
  "hsc-statistics-2022-annual-em": {
    "old": "1FARZVGLDZ1-zbPnajHvBsO8NDUBwrRA6",
    "new": "1zMEPow3qTmG_pvitvNlnzCBsOr8rKkAo"
  },
  "hsc-statistics-2024-annual-em": {
    "old": "1VNd9mz5e0rdLf2jM3mgzGhwe-u5qt5ay",
    "new": "1aAzewAZ6kGhQCvbh4qn6QIZrw2PofZ5_"
  },
  "hsc-statistics-2025-annual-em": {
    "old": "1SfJeJRLrawqOIWiigGqiC0aNV8qr139C",
    "new": "1SclhuEtVeG09HUw6OqhIORLfxXpELaEt"
  },
  "hsc-tamil-2022-annual-tm": {
    "old": "15663GOhx80t1lMxgquls0b0ml7tiyuRs",
    "new": "11ZeFnYn6bW8leyhnJ_ggvjJlgJxRv0lC"
  },
  "hsc-zoology-2022-annual-em": {
    "old": "15ANI4MNJk3mL7i9z828C6kaFfUEC9_VW",
    "new": "1f8sJaPAJG8KBAtkZDQNLHqIKY5fkgMEm"
  },
  "hsc-accountancy-2024-annual-tm": {
    "old": "1ppY67OAUBAly0nV_9YPqJyAjsmW6Clbi",
    "new": "1hgMc9HbL0ku3qfeoysF5kBGnXuI0RXbr"
  },
  "hsc-biology-2024-annual-tm": {
    "old": "1U66L1NUDfxkVa_aWA_py4R7BD6R0h5RW",
    "new": "1pW3KeNvhSo8NrnEnsXYVqeW_EwEK-n5H"
  },
  "hsc-biology-2025-annual-tm": {
    "old": "1_6qIlREphDC6XkWFN51wSXhQwyo907U3",
    "new": "1tZ9BaKZzj3AaOQw61WzxD9ltrEg9Zi3r"
  },
  "hsc-botany-2024-annual-tm": {
    "old": "1igBR4VSXQ-hnNz2DPp8VkDThkc-aebxT",
    "new": "1ykc8TymxTqTAtId6kDcr-87M_8CuBfnC"
  },
  "hsc-botany-2025-annual-tm": {
    "old": "1phWSx4Ay0LoDImvSIZB_sClvV454XOSQ",
    "new": "1bfVQFfhstJifT9hctMoOvlsasCwzQq7k"
  },
  "hsc-business-maths-2024-annual-tm": {
    "old": "142jDGulQq1h5Csl6X0QxvYmX0NKrw_k-",
    "new": "19rJP-okdFF_VQl-ckyyNEbMgIJfFG-hL"
  },
  "hsc-commerce-2024-annual-tm": {
    "old": "1NTgL86tHv81NrnhB5AgpcPjQjQBvpKVt",
    "new": "1XcIX5eKvsH2e0GXOJeGPGj3hITnJUv-X"
  },
  "hsc-computer-science-2024-annual-tm": {
    "old": "1G7GhNmH62_8JCQR3mcG9te1EWnokEAa5",
    "new": "1J507DhKVGaE0L6igrnkdpnIYlny154kt"
  },
  "hsc-computer-science-2025-annual-tm": {
    "old": "1DTb0RfTh5v6NRVEBaVG81zoKfsVCEX3A",
    "new": "1LNxBPn8nmWzBjZs8DYv7kjLIbIGxmOQH"
  },
  "hsc-economics-2024-annual-tm": {
    "old": "1TWTt7AsSVImwfm8oJwjnO-hOVY32XWTy",
    "new": "1OnsrJvesiKaywLeGm3YtvyB_uk1LeKMm"
  },
  "hsc-economics-2025-annual-tm": {
    "old": "1ugzYr3egG6KZf3YmpobkbDutkZbux0_M",
    "new": "1H6Pn9S4Nh5Cma1VPlod2PdMK7dCC1fpR"
  },
  "hsc-history-2024-annual-tm": {
    "old": "1rAUttPL-nDqkBYy7CWvaK8XE7hqDhve8",
    "new": "19kwFiRRIDQrsUmXPA5hQmpS3a7LxW7g_"
  },
  "hsc-history-2025-annual-tm": {
    "old": "1YuEx2VOILTfpQmJSsKKrnaQADfv39Z1z",
    "new": "1MTfo2cyXVu_EwUsUasVAbm6fnNxnjvv_"
  },
  "hsc-political-science-2023-annual-tm": {
    "old": "1zFziRcGz-O75aDvYEAIKgItSNGUopA0l",
    "new": "1fmuxoR_vF6CVAiI4l_hXaoVhMwxqWi8G"
  },
  "hsc-statistics-2023-annual-tm": {
    "old": "121Dt9X2vhJvY_HRs4_4GyKk4wKQQRSgi",
    "new": "1vt0AiW8WIJThdSKrlQwd9z9BTiM5ZrN8"
  },
  "hsc-zoology-2024-annual-tm": {
    "old": "1_8ukSxrgxnV84rFvO5wCyQ_ZuFaT2MOd",
    "new": "1Tt5wokMFCpWU70v_Q4NkT5aEywIyPXBv"
  },
  "cls11-botany-2024-annual-tm": {
    "old": "1-m-0z0v9INqqsqWa9bQwpWXuasUfL0f8",
    "new": "1519C9cvlveJhISAPVzriyOiJNWour-v9"
  },
  "cls11-business-maths-2024-annual-tm": {
    "old": "1z498gCeg_7VATlNPWXQakeI4Cm5sc7Dw",
    "new": "1YpwaJOyLKx-aDRRB4Uf8kiHzuqW5GS4R"
  },
  "cls11-commerce-2024-annual-tm": {
    "old": "1HnV4hXdrOAt3gR55ECsheE7ur_465mco",
    "new": "1T6jddvmr1fqpVzpCiQw1hiozfaC0fmfm"
  },
  "cls11-computer-applications-2024-annual-tm": {
    "old": "1AxP0IqzbaRL4_oOTdzgUgoT9SZKxjjEe",
    "new": "1-mPn0bXGjBjdrvovaQFOHvtAKTxSjn9U"
  },
  "cls11-computer-science-2024-annual-tm": {
    "old": "1j4hnUhO4QnIHGZZ2GrwP6GOJkPQDsG5m",
    "new": "1nIDiuQI4Cvow_UH3NToH1yhvwTEDSw0g"
  },
  "cls11-economics-2024-annual-tm": {
    "old": "124P5TGMM04K2_XhQeubN6WspomfBd2fc",
    "new": "1WUnNzZtTni4JmNEL3SMN23ocOt8FlhcL"
  },
  "cls11-history-2024-annual-tm": {
    "old": "1AAH93wBvQf7x4vHS0SAq8pakedH9mBS6",
    "new": "1v-xAMu3dqxp0L2DF3QoPi0gNHm9AwncL"
  },
  "cls11-mathematics-2024-annual-tm": {
    "old": "1oSAEfiAsZQKsZWBz1e5fwxQo4ww7o-ZC",
    "new": "18X0Is2yWe92m4cYND3nCaeeUco1ZOShF"
  },
  "cls11-physics-2024-annual-tm": {
    "old": "1lJubvLiz-jzVnFHDczqgPcWDEkGK0g2Z",
    "new": "17ajJWy0vT7l3gv-bJNPEgJdV7K3zDAsS"
  },
  "cls11-science-2024-annual-tm": {
    "old": "1V8yYtWnWIPgfr4L1B84TJjgwcHWPgS4Q",
    "new": "12SKENlHQObtuyPEc7IAgmJIBcM0JZA1n"
  },
  "cls11-statistics-2024-annual-tm": {
    "old": "1lZf49bpG4TbmvFyQGASmKxXBVev2vC6p",
    "new": "1dmgEULsE4rGgABFqknwKKzNEMK3Gl4iS"
  },
  "cls11-zoology-2024-annual-tm": {
    "old": "1-TQ37fotKdxsPgW_OtdI7S4Ug9qSI-xJ",
    "new": "1IrN7etXZqe0WANJRhZscBoVWu_Dot_xN"
  },
  "cls11-accountancy-2025-annual-tm": {
    "old": "1GM-Yfd0gSX_gP6r6sCziNhQms5BZo9w7",
    "new": "109R5ABQkzO5vASl-TWaG3jPu742pj--g"
  },
  "cls11-biology-2025-annual-tm": {
    "old": "1q6XNGDxD4eF_g1tR7mryRv8amkLseS2B",
    "new": "160oCOzOTcu7-jKuk8XHyUEVqbpjOwYiu"
  },
  "cls11-botany-2025-annual-tm": {
    "old": "16NZvD9wj-3gy6vu59Wt5YFv2Wo_K9_PA",
    "new": "11h1zhMCgJwA3o7AIMetAK8mXEtQuzCf3"
  },
  "cls11-business-maths-2025-annual-tm": {
    "old": "1EMhAvbSEwQKHVVYBFwkbgj_cmOy6mUTG",
    "new": "1j4UbQ6ObjdHHr3reYi8DipRVsR0Kr75y"
  },
  "cls11-chemistry-2025-annual-tm": {
    "old": "17UUqJ0jpuVhvtbHOde_8S1XXtjdOo-HO",
    "new": "1ocVB0fv9o3eSQAsewQUovjezjh4OPB4D"
  },
  "cls11-commerce-2025-annual-tm": {
    "old": "1ERswALOnmz3WP3bXch-hTVYQo37ZpRbv",
    "new": "1rVgVTc8yYAvmwiME9n25yaIShFZtdf6y"
  },
  "cls11-computer-applications-2025-annual-tm": {
    "old": "1SdWgqWol7wjQvT0vbNMr1t4oBGRnyX2c",
    "new": "1kTLpXdUGp4I1n-rq187IW8tE64LIwuhL"
  },
  "cls11-computer-science-2025-annual-tm": {
    "old": "1Q8fgRnQb2kldYapy6meefPjMCGvAyuPq",
    "new": "1F63-MSyaj4GOkzMHlW_BWQocCWO2lJgf"
  },
  "cls11-history-2025-annual-tm": {
    "old": "1JxQB_0gIGqxtSmqjU_q1DOrbWCXrSqUj",
    "new": "1oSLvAWwMU6hUripQklzdXFQzO0FqBxZW"
  },
  "cls11-mathematics-2025-annual-tm": {
    "old": "1D6fZFd0QqllWApitEpEwgPljb8FO-ofL",
    "new": "1IOIUZ8b5FWnDOr0sOhOTK2QJtfZH2g_T"
  },
  "cls11-physics-2025-annual-tm": {
    "old": "1x_HfhyE9V2aylLHv7BrqYgPqT9nd4y2-",
    "new": "1HWJHHNSV1-HWBZaoAMnqG073Q-yWSYT3"
  },
  "cls11-science-2025-annual-tm": {
    "old": "1f8kjNSKEPTyagKQ9m6OYGtiwgfSvZ8Ti",
    "new": "1bRx-Jwwilwn5EB8GOjF8A922qj85_Z5R"
  },
  "cls11-zoology-2025-annual-tm": {
    "old": "1FgDCMpHUJrNMf-7cwGa8mhiHVYcgN4q0",
    "new": "1EFICW24-AtGUCKUz0I6-FCt8azQj_ZhA"
  },
  "cls11-botany-2022-annual-tm": {
    "old": "1wh_bcxNDGMp7UZGYOjtH-Dp_9DYxKeGf",
    "new": "1fgdtPvE8LY3Iu44D59DbJlyz6NwP5nlb"
  },
  "cls11-business-maths-2022-annual-tm": {
    "old": "1jTRzYvyzUlKJT-BISRqnEl47S05vi88D",
    "new": "1_Y621-UeEuRpvd-jKI21JGQf1QiW25Lj"
  },
  "cls11-computer-applications-2022-annual-tm": {
    "old": "11GHmVrvGqNwDpXW2f8Vn9V0pI58AUsLN",
    "new": "1v5knMta7DS0XxRZa944YEwLnhDmf86BT"
  },
  "cls11-history-2022-annual-tm": {
    "old": "1IsC5BhmyVrAoaXl2fjgvvGFwcdDtjniQ",
    "new": "1GKlLX5_rWrau_SPxEH1P5rZy1rqXX5Lp"
  },
  "cls11-zoology-2022-annual-tm": {
    "old": "1fG35Zf3N7RqhkkGJ_RPCbr5JXUoRSIkK",
    "new": "1g32xMvA-j40TMIVlegc6NespVUDghAjS"
  },
  "cls11-history-2023-annual-tm": {
    "old": "1nWePDNzOeDNNczt9cxGTxhuKZS89FnOb",
    "new": "1O58o-Gh_HiivFxtRveV31XBkdM5eOJKX"
  },
  "cls11-science-2023-annual-tm": {
    "old": "1cplHz_erYTLB4lZeIl2QAn4fO50a-ZjX",
    "new": "1WonhwLLRKCEN2Bw7WMrwp1-fqonvv4gJ"
  },
  "cls11-accountancy-2024-annual-tm": {
    "old": "1SW_mUPDkRd0TThNblNoCK1fHgIkEi4Xh",
    "new": "1Q67REo4UptFVCdwTbgyykVl8qp_VfwpH"
  },
  "cls11-biology-2024-annual-tm": {
    "old": "1zlqCJhAksQyAEw8Ikca3P0djib39PeCe",
    "new": "186-QMAvnv0cyX9RieUfRrZjWlGNERSW1"
  },
  "cls11-business-maths-2023-annual-tm": {
    "old": "1al8jnLyErpPYG2pHeuppWBYSlxnype6E",
    "new": "1YK2M-lzC9yhEx60HEhTrUbJ2BdNROdB4"
  },
  "cls11-computer-applications-2023-annual-em": {
    "old": "1kLNUcIfKYbfrxzlD0W12jbW8triM2UxH",
    "new": "1fD2HMaxKCXWfr_ya5ey-ctv3qnE6nVfO"
  },
  "cls11-zoology-2023-annual-em": {
    "old": "1rzbBRuWeitUPxzM7wb90IuLG6DEivGYa",
    "new": "1bePU9rmqky4nOpGVaKnNXHG9rTjMWo67"
  },
  "cls11-chemistry-2024-annual-tm": {
    "old": "1xFKDvFf5YZF4e5CphBYfdRIehh0VzoWi",
    "new": "1RoysajpfrUFrrnaw2uaw_b7E-P_UiVc4"
  },
  "cls12-business-maths-2025-annual-tm": {
    "old": "1oLr6_q8hNCrexpkUG2u9M1B4MfDI9ohU",
    "new": "1xr07ZdP9da8zHVXuWltjXl5MumcV6sfQ"
  }
};

async function main() {
  const ids = Object.keys(SWAP_79_DATA);
  console.log(`Processing ${ids.length} rows to swap...`);

  // 1. Build SWAP-79-VERIFIED.json structure
  const verifiedMap = {};
  for (const [id, info] of Object.entries(SWAP_79_DATA)) {
    verifiedMap[id] = {
      liveDriveFileId_now: info.old,
      swapTo: info.new,
    };
  }

  // Write ops/SWAP-79-VERIFIED.json
  const opsDir = path.join(rootDir, 'ops');
  if (!fs.existsSync(opsDir)) fs.mkdirSync(opsDir, { recursive: true });
  fs.writeFileSync(path.join(opsDir, 'SWAP-79-VERIFIED.json'), JSON.stringify(verifiedMap, null, 2), 'utf8');

  // Write centum/ops/SWAP-79-VERIFIED.json
  const centumOpsDir = path.join(rootDir, 'centum', 'ops');
  if (!fs.existsSync(centumOpsDir)) fs.mkdirSync(centumOpsDir, { recursive: true });
  fs.writeFileSync(path.join(centumOpsDir, 'SWAP-79-VERIFIED.json'), JSON.stringify(verifiedMap, null, 2), 'utf8');
  console.log('✓ Written ops/SWAP-79-VERIFIED.json & centum/ops/SWAP-79-VERIFIED.json');

  // 2. Update src/data/paper-swaps.json
  const swapsPath = path.join(rootDir, 'src', 'data', 'paper-swaps.json');
  const paperSwaps = fs.existsSync(swapsPath) ? JSON.parse(fs.readFileSync(swapsPath, 'utf8')) : {};
  let addedSwaps = 0;
  for (const [id, info] of Object.entries(SWAP_79_DATA)) {
    paperSwaps[id] = info.new;
    addedSwaps++;
  }
  fs.writeFileSync(swapsPath, JSON.stringify(paperSwaps, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated src/data/paper-swaps.json: total swaps now ${Object.keys(paperSwaps).length} (added/updated ${addedSwaps})`);

  // 3. Update src/data/papers.json
  const papersPath = path.join(rootDir, 'src', 'data', 'papers.json');
  if (fs.existsSync(papersPath)) {
    const papers = JSON.parse(fs.readFileSync(papersPath, 'utf8'));
    let updatedInPapersJson = 0;
    const modified = papers.map((p) => {
      const swap = SWAP_79_DATA[p.id];
      if (swap) {
        updatedInPapersJson++;
        return {
          ...p,
          driveFileId: swap.new,
          pdfUrl: `https://drive.google.com/uc?id=${swap.new}&export=download`,
        };
      }
      return p;
    });
    fs.writeFileSync(papersPath, JSON.stringify(modified, null, 2) + '\n', 'utf8');
    console.log(`✓ Updated src/data/papers.json: updated ${updatedInPapersJson} rows, total papers ${modified.length}`);
  }
}

main().catch(console.error);
