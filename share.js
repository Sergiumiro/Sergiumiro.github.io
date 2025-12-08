// Sharing functionality for the Telegram Mini App
function initializeSharing() {
    // Check if we're in Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
        const webApp = window.Telegram.WebApp;
        
        // Enable the share button if available
        if (webApp.share) {
            // Create share button in header
            const header = document.querySelector('.header');
            const shareButton = document.createElement('button');
            shareButton.textContent = 'Поделиться';
            shareButton.style.float = 'right';
            shareButton.style.background = '#3498db';
            shareButton.style.color = 'white';
            shareButton.style.border = 'none';
            shareButton.style.padding = '5px 10px';
            shareButton.style.borderRadius = '4px';
            shareButton.style.cursor = 'pointer';
            
            shareButton.addEventListener('click', function() {
                webApp.share({
                    url: window.location.href,
                    text: 'Приложение COMIC-CON Фестиваль - смотрите расписание и находите залы!'
                });
            });
            
            header.appendChild(shareButton);
        }
    } else {
        // Fallback for non-Telegram environments
        console.log('Not running in Telegram Web App environment');
    }
}

// Initialize sharing when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSharing);

// Function to share specific events
function shareEvent(event) {
    if (window.Telegram && window.Telegram.WebApp) {
        const webApp = window.Telegram.WebApp;
        if (webApp.share) {
            webApp.share({
                url: `${window.location.href}#event=${event.id}`,
                text: `Смотри, интересное событие "${event.title}" в зале ${event.hall}!`
            });
        } else {
            // Fallback to clipboard API
            navigator.clipboard.writeText(`${window.location.href} - ${event.title} в зале ${event.hall}`)
                .then(() => {
                    alert('Ссылка скопирована в буфер обмена!');
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        }
    } else {
        // Fallback for non-Telegram environments
        navigator.clipboard.writeText(`${window.location.href} - ${event.title} в зале ${event.hall}`)
            .then(() => {
                alert('Ссылка скопирована в буфер обмена!');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }
}

// Expose functions globally
window.shareEvent = shareEvent;