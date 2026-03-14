const startButton = document.getElementById('startApplication');
const loanForm = document.getElementById('loanForm');
const closeButton = document.getElementById('closeApplication');
const formStatus = document.getElementById('formStatus');
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx6pvfG5u-IPuT2v1N4D9pdaGUagVt96w1Eq2ibapyYVeuFJmXtQZixoskS-DSmmNaK/exec';
const CALLBACK_URL = 'https://script.google.com/macros/s/AKfycbwEVzoTwDIgmMadGhOpZWGwI0RQkR_gt9qQKs_DzxpmA0KFoQbHzJlGILpaI__CTA8gbg/exec';
const callbackForm = document.getElementById('callbackForm');
const callbackStatus = document.getElementById('callbackStatus');

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
      await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ data, files })
      });

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

  formData.forEach((value, key) => {
    if (!(value instanceof File) || !value.name) return;
    if (!fileGroups[key]) fileGroups[key] = [];
    filePromises.push(
      fileToBase64(value).then((fileObj) => {
        fileGroups[key].push(fileObj);
      })
    );
  });

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
