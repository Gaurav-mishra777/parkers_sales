const startButton = document.getElementById('startApplication');
const loanForm = document.getElementById('loanForm');
const closeButton = document.getElementById('closeApplication');
const formStatus = document.getElementById('formStatus');
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyuVGi0sgCD-HLFLD0DEbISywSegtroVkRt67v9Yqqun4kLIQzsmxHbn3BwDBp1nHNc/exec';
const CALLBACK_URL = 'https://script.google.com/macros/s/AKfycbwEVzoTwDIgmMadGhOpZWGwI0RQkR_gt9qQKs_DzxpmA0KFoQbHzJlGILpaI__CTA8gbg/exec';
const callbackForm = document.getElementById('callbackForm');
const callbackStatus = document.getElementById('callbackStatus');
const MAX_TOTAL_FILE_MB = 20;
const MAX_SINGLE_FILE_MB = 8;
const MAX_TOTAL_FILE_BYTES = MAX_TOTAL_FILE_MB * 1024 * 1024;
const MAX_SINGLE_FILE_BYTES = MAX_SINGLE_FILE_MB * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 45000;

if (startButton && loanForm && closeButton) {
  startButton.addEventListener('click', () => {
    loanForm.classList.remove('hidden');
    startButton.classList.add('hidden');
    closeButton.classList.remove('hidden');
    loanForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  closeButton.addEventListener('click', () => {
    loanForm.classList.add('hidden');
    closeButton.classList.add('hidden');
    startButton.classList.remove('hidden');
  });

  loanForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = loanForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    if (formStatus) {
      formStatus.className = 'form-status';
      formStatus.textContent = 'Submitting your application...';
    }
    const formData = new FormData(loanForm);
    const data = {};

    formData.forEach((value, key) => {
      if (value instanceof File) return;
      data[key] = value;
    });

    try {
      const files = await collectFiles(formData);
      await fetchWithTimeout(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ data, files })
      }, REQUEST_TIMEOUT_MS);

      if (formStatus) {
        formStatus.className = 'form-status success';
        formStatus.textContent = 'Thank you! Your application has been submitted successfully.';
      }
      loanForm.reset();
    } catch (error) {
      if (formStatus) {
        formStatus.className = 'form-status error';
        formStatus.textContent = 'Sorry, we could not submit your application. Please try again.';
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

function collectFiles(formData) {
  const fileGroups = {};
  const filePromises = [];
  const sizeIssues = [];
  let totalBytes = 0;

  formData.forEach((value, key) => {
    if (!(value instanceof File) || !value.name) return;
    if (value.size > MAX_SINGLE_FILE_BYTES) {
      sizeIssues.push(`${value.name} exceeds ${MAX_SINGLE_FILE_MB} MB.`);
      return;
    }
    totalBytes += value.size;
    if (totalBytes > MAX_TOTAL_FILE_BYTES) {
      sizeIssues.push(`Total attachments exceed ${MAX_TOTAL_FILE_MB} MB.`);
      return;
    }
    if (!fileGroups[key]) fileGroups[key] = [];
    filePromises.push(
      fileToBase64(value).then((fileObj) => {
        fileGroups[key].push(fileObj);
      })
    );
  });

  if (sizeIssues.length) {
    return Promise.reject(new Error(sizeIssues.join(' ')));
  }

  return Promise.all(filePromises).then(() => fileGroups);
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: base64
      });
    };
    reader.readAsDataURL(file);
  });
}

function fetchWithTimeout(url, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timed out. Please try again.'));
    }, timeoutMs);

    fetch(url, options)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

if (callbackForm) {
  callbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!callbackForm.checkValidity()) {
      if (callbackStatus) {
        callbackStatus.className = 'form-status error';
        callbackStatus.textContent = 'Please fill all required fields.';
      }
      callbackForm.reportValidity();
      return;
    }
    const submitButton = callbackForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    if (callbackStatus) {
      callbackStatus.className = 'form-status';
      callbackStatus.textContent = 'Submitting your request...';
    }

    const formData = new FormData(callbackForm);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      await fetch(CALLBACK_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ data })
      });

      if (callbackStatus) {
        callbackStatus.className = 'form-status success';
        callbackStatus.textContent = 'Thanks! We will call you back shortly.';
      }
      callbackForm.reset();
    } catch (error) {
      if (callbackStatus) {
        callbackStatus.className = 'form-status error';
        callbackStatus.textContent = 'Sorry, we could not submit your request. Please try again.';
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
