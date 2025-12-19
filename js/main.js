(() => {
  /***********************
   * 0) DOM 준비
   ***********************/
  document.addEventListener("DOMContentLoaded", () => {
    /***********************
     * 1) 설정값
     ***********************/
    const ENDPOINT_URL =
      "https://script.google.com/macros/s/AKfycbz_0MgDOdEFhxIHHr4jpnLLJByQGpViPfkjfpiH6v_Dd2_KRlsIXSb0ecXxUIa9uvHL0w/exec";
    const FORM_TOKEN = "leflex-b2b-2026-0612";

    const PRODUCTS = [
      { name: "넥게이터", options: ["free / 블랙", "S / 화이트"] },
      { name: "바라클라바 코지", options: ["커버업 / 블랙", "베이직 / 차콜"] },
      { name: "오리지널 자외선차단 마스크", options: ["free / 블랙"] },
      { name: "프로스트엑스 장갑", options: ["블랙"] },
      { name: "직접 입력", options: ["직접 입력"] },
    ];

    const MAX_ITEMS = 5;

    /***********************
     * 2) 유틸
     ***********************/
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    function onlyDigits(str) {
      return (str || "").replace(/[^\d]/g, "");
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, (s) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[s]));
    }

    function showStatus(type, msg) {
      const box = $("#statusBox");
      if (!box) return;

      box.classList.remove("hide", "errorBox", "successBox");
      box.classList.add(type === "error" ? "errorBox" : "successBox");
      box.textContent = msg;
      box.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function clearStatus() {
      const box = $("#statusBox");
      if (!box) return;

      box.className = "hide";
      box.textContent = "";
    }

    /***********************
     * 3) 회계 담당자 토글
     ***********************/
    const accountingBox = $("#accountingBox");
    const accName = $("#accName");
    const accPhone = $("#accPhone");
    const accEmail = $("#accEmail");

    function setAccountingRequired(on) {
      if (accName) accName.required = on;
      if (accPhone) accPhone.required = on;
      if (accEmail) accEmail.required = on;
    }

    function clearAccountingValues() {
      if (accName) accName.value = "";
      if (accPhone) accPhone.value = "";
      if (accEmail) accEmail.value = "";
    }

    function setAccounting(on) {
      if (!accountingBox) return;

      if (on) {
        accountingBox.classList.remove("hide");
        setAccountingRequired(true);
      } else {
        accountingBox.classList.add("hide");
        setAccountingRequired(false);
        clearAccountingValues();
      }
    }

    $$('input[name="accountingToggle"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        const on = $('input[name="accountingToggle"]:checked')?.value === "add";
        setAccounting(on);
      });
    });

    // 초기: 제외하기(숨김)
    setAccounting(false);

    /***********************
     * 4) 상품 라인 (최대 5개)
     ***********************/
    const itemsWrap = $("#itemsWrap");
    const addItemBtn = $("#addItemBtn");

    function productOptionsHtml(productName) {
      const product = PRODUCTS.find((p) => p.name === productName) || PRODUCTS[0];
      return (product.options || [])
        .map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`)
        .join("");
    }

    function renumberItems() {
      if (!itemsWrap) return;
      [...itemsWrap.children].forEach((card, i) => {
        const h2 = card.querySelector("h2");
        if (h2) h2.textContent = `6. 상품명 / 옵션 (${i + 1})`;
      });
    }

    function syncAddBtnState() {
      if (!itemsWrap || !addItemBtn) return;
      const count = itemsWrap.children.length;
      addItemBtn.disabled = count >= MAX_ITEMS;
      addItemBtn.textContent = count >= MAX_ITEMS ? "최대 5개까지 추가 가능" : "+ 상품 추가";
    }

    function createItemRow(index) {
      const div = document.createElement("div");
      div.className = "itemCard";

      div.innerHTML = `
        <div class="sectionTitle">
          <h2>6. 상품명 / 옵션 (${index})</h2>
          <div class="meta">
            <button type="button" class="btn danger" data-remove>삭제</button>
          </div>
        </div>

        <div class="grid" style="margin-top:10px;">
          <div>
            <label class="req">상품명</label>
            <select data-product required>
              <option value="" selected disabled>선택</option>
              ${PRODUCTS.map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join("")}
            </select>
          </div>

          <div>
            <label class="req">옵션</label>
            <select data-option required disabled>
              <option value="" selected disabled>상품 먼저 선택</option>
            </select>
          </div>

          <div>
            <label class="req">수량</label>
            <input data-qty inputmode="numeric" placeholder="예: 100" required />
          </div>

          <div data-custom-wrap class="hide">
            <label>직접 입력</label>
            <input data-custom placeholder="상품 / 옵션 상세 입력" />
            <div class="help">‘직접 입력’을 선택한 경우 여기에 상세를 적어주세요.</div>
          </div>

          <div>
            <label>비고</label>
            <input data-memo placeholder="색상/사이즈 혼합 등" />
          </div>
        </div>
      `;

      div.querySelector("[data-remove]")?.addEventListener("click", () => {
        div.remove();
        renumberItems();
        syncAddBtnState();
      });

      const productSel = div.querySelector("[data-product]");
      const optionSel = div.querySelector("[data-option]");
      const qtyInput = div.querySelector("[data-qty]");
      const customWrap = div.querySelector("[data-custom-wrap]");
      const customInput = div.querySelector("[data-custom]");

      productSel?.addEventListener("change", () => {
        const p = productSel.value;

        if (optionSel) {
          optionSel.disabled = false;
          optionSel.innerHTML =
            `<option value="" disabled selected>선택</option>` + productOptionsHtml(p);
        }

        const isCustom = p === "직접 입력";
        if (customWrap) customWrap.classList.toggle("hide", !isCustom);
        if (!isCustom && customInput) customInput.value = "";
      });

      qtyInput?.addEventListener("input", () => {
        qtyInput.value = onlyDigits(qtyInput.value);
      });

      return div;
    }

    addItemBtn?.addEventListener("click", () => {
      if (!itemsWrap) return;
      if (itemsWrap.children.length >= MAX_ITEMS) return;

      itemsWrap.appendChild(createItemRow(itemsWrap.children.length + 1));
      syncAddBtnState();
    });

    if (itemsWrap) {
      itemsWrap.innerHTML = "";
      itemsWrap.appendChild(createItemRow(1));
      syncAddBtnState();
    }

    /***********************
     * 5) 전자세금계산서 선택 시 12번 활성화
     ***********************/
    const taxModeSel = $("#taxMode");

    function syncTaxMode() {
      const hasTax = $$('input[name="docs"]:checked')
        .map((x) => x.value)
        .includes("전자세금계산서");

      if (!taxModeSel) return;
      taxModeSel.disabled = !hasTax;
      taxModeSel.required = hasTax;
      if (!hasTax) taxModeSel.value = "";
    }

    $$('input[name="docs"]').forEach((c) => c.addEventListener("change", syncTaxMode));
    syncTaxMode();

    /***********************
     * 6) 제출
     ***********************/
    const form = $("#quoteForm");
    const submitBtn = $("#submitBtn");
    const phone = $("#phone");

    phone?.addEventListener("input", (e) => (e.target.value = onlyDigits(e.target.value)));
    accPhone?.addEventListener("input", (e) => (e.target.value = onlyDigits(e.target.value)));

    function collectItems() {
      if (!itemsWrap) return [];
      const cards = Array.from(itemsWrap.children);

      return cards.map((card) => {
        const product = card.querySelector("[data-product]")?.value || "";
        const option = card.querySelector("[data-option]")?.value || "";
        const qtyRaw = card.querySelector("[data-qty]")?.value || "";
        const memo = card.querySelector("[data-memo]")?.value || "";
        const customDetail = card.querySelector("[data-custom]")?.value || "";

        return {
          product,
          option,
          qty: Number(qtyRaw || 0),
          memo: memo || "",
          customDetail: customDetail || "",
        };
      });
    }

    function validateItems(items) {
      if (!items.length) return "상품을 최소 1개 이상 추가해주세요.";

      for (const it of items) {
        if (!it.product) return "상품명을 선택해주세요.";
        if (!it.option) return "옵션을 선택해주세요.";
        if (!it.qty || it.qty <= 0) return "상품 수량은 1 이상 숫자로 입력해주세요.";

        if (it.product === "직접 입력") {
          if (!it.customDetail || it.customDetail.trim().length < 2) {
            return "‘직접 입력’을 선택한 상품은 직접 입력 내용을 작성해주세요.";
          }
        }
      }
      return null;
    }

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearStatus();

      if (!form.checkValidity()) {
        showStatus("error", "필수 항목을 확인해주세요.");
        form.reportValidity();
        return;
      }

      const items = collectItems();
      const itemErr = validateItems(items);
      if (itemErr) {
        showStatus("error", itemErr);
        return;
      }

      const accOn = $('input[name="accountingToggle"]:checked')?.value === "add";

      const payload = {
        token: FORM_TOKEN,
        submittedAt: new Date().toISOString(),

        company: $("#company")?.value.trim() || "",
        managerName: $("#managerName")?.value.trim() || "",
        phone: onlyDigits(phone?.value || ""),
        email: ($("#email")?.value || "").trim(),

        accountingEnabled: accOn,
        accounting: accOn
          ? {
              name: (accName?.value || "").trim(),
              phone: onlyDigits(accPhone?.value || ""),
              email: (accEmail?.value || "").trim(),
            }
          : null,

        items,

        usage: $("#usage")?.value || "",
        dueDate: $("#dueDate")?.value || "",
        tradeType: $("#tradeType")?.value || "",

        docs: $$('input[name="docs"]:checked').map((x) => x.value),
        taxMode: taxModeSel?.value || "",

        notes: ($("#notes")?.value || "").trim(),

        // ✅ 추가: 추적용 메타
        origin: window.location.origin,
        source: "vercel",
        userAgent: navigator.userAgent,
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "전송 중...";
      }

      try {
        const res = await fetch(ENDPOINT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          json = { ok: false, error: text };
        }

        if (!json.ok) throw new Error(json.error || "서버 오류");

        // ✅ 변경: leadId 있으면 같이 노출
        if (json.leadId) {
          showStatus("success", `접수 완료! (접수번호: ${json.leadId}) 빠르게 확인 후 안내드리겠습니다.`);
        } else {
          showStatus("success", "접수 완료! 빠르게 확인 후 안내드리겠습니다.");
        }

        // 리셋
        form.reset();

        // 회계 담당자: 제외 기본
        const skipRadio = $$('input[name="accountingToggle"]').find((r) => r.value === "skip");
        if (skipRadio) skipRadio.checked = true;
        setAccounting(false);

        // 상품 초기화
        if (itemsWrap) {
          itemsWrap.innerHTML = "";
          itemsWrap.appendChild(createItemRow(1));
          syncAddBtnState();
        }

        // 세금계산서 옵션 초기화
        $$('input[name="docs"]').forEach((c) => (c.checked = false));
        syncTaxMode();
      } catch (err) {
        showStatus("error", "전송 실패: " + (err?.message || "알 수 없는 오류"));
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "제출하기";
        }
      }
    });
  });
})();
