import { ChatMessage, ChatAttachment, MediaType } from '../types/chat';

// Common media extension categorizer
export function getMediaTypeFromFilename(fileName: string): MediaType {
  const lower = fileName.toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif|heic|bmp)$/.test(lower)) {
    if (lower.startsWith('stk-') || lower.includes('sticker')) {
      return 'sticker';
    }
    return 'image';
  }
  if (/\.(mp4|mov|mkv|webm|3gp|avi)$/.test(lower)) {
    return 'video';
  }
  if (/\.(opus|ogg|m4a|mp3|wav|aac|flac)$/.test(lower)) {
    return 'audio';
  }
  return 'document';
}

export function getMimeTypeFromFilename(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.opus') || lower.endsWith('.ogg')) return 'audio/ogg; codecs=opus';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.vcf')) return 'text/vcard';
  return 'application/octet-stream';
}

// Check for attachment patterns
function parseAttachment(text: string): { attachment?: ChatAttachment; cleanText: string } {
  // Pattern 1: Android "filename.ext (file attached)"
  const androidAttachRegex = /([\w\d\-_ .]+\.(jpg|jpeg|png|webp|gif|mp4|mov|opus|ogg|m4a|mp3|pdf|docx?|xlsx?|pptx?|vcf|zip))\s*\(file attached\)/i;
  const androidMatch = text.match(androidAttachRegex);
  if (androidMatch) {
    const fileName = androidMatch[1].trim();
    const mediaType = getMediaTypeFromFilename(fileName);
    const mimeType = getMimeTypeFromFilename(fileName);
    const clean = text.replace(androidMatch[0], '').trim();
    return {
      attachment: {
        fileName,
        mediaType,
        mimeType
      },
      cleanText: clean
    };
  }

  // Pattern 2: iOS "<attached: filename.ext>"
  const iosAttachRegex = /<attached:\s*([^>]+)>/i;
  const iosMatch = text.match(iosAttachRegex);
  if (iosMatch) {
    const fileName = iosMatch[1].trim();
    const mediaType = getMediaTypeFromFilename(fileName);
    const mimeType = getMimeTypeFromFilename(fileName);
    const clean = text.replace(iosMatch[0], '').trim();
    return {
      attachment: {
        fileName,
        mediaType,
        mimeType
      },
      cleanText: clean
    };
  }

  // Pattern 3: <Media omitted>
  if (/<Media omitted>/i.test(text)) {
    return {
      attachment: {
        fileName: 'Media omitted',
        mediaType: 'image',
        mimeType: '',
        isOmitted: true
      },
      cleanText: text.replace(/<Media omitted>/gi, '').trim()
    };
  }

  return { cleanText: text };
}

// Parse date string into Date object
function parseDateTime(dateStr: string, timeStr: string): Date {
  try {
    // Normalise non-breaking space and LRM/RLM
    const cleanTime = timeStr.replace(/[\u202F\u00A0\u200e\u200f]/g, ' ').trim();
    const cleanDate = dateStr.replace(/[\u202F\u00A0\u200e\u200f]/g, ' ').trim();

    // Split date components
    const dateParts = cleanDate.split(/[\/\.\-]/).map(p => parseInt(p, 10));
    let day = 1, month = 1, year = 2024;

    if (dateParts.length === 3) {
      if (dateParts[0] > 12) {
        day = dateParts[0];
        month = dateParts[1];
        year = dateParts[2];
      } else if (dateParts[1] > 12) {
        month = dateParts[0];
        day = dateParts[1];
        year = dateParts[2];
      } else {
        // WhatsApp default in exports outside US
        day = dateParts[0];
        month = dateParts[1];
        year = dateParts[2];
      }

      if (year < 100) {
        year += 2000;
      }
    }

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    const is12Hour = /am|pm/i.test(cleanTime);
    const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);

    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      if (timeMatch[3]) seconds = parseInt(timeMatch[3], 10);
      const meridiem = timeMatch[4]?.toLowerCase();

      if (is12Hour) {
        if (meridiem === 'pm' && hours < 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
      }
    }

    return new Date(year, month - 1, day, hours, minutes, seconds);
  } catch {
    return new Date();
  }
}

const SYSTEM_PATTERNS = [
  /Messages and calls are end-to-end encrypted/i,
  /created group/i,
  /joined using this group/i,
  /added you/i,
  /changed the subject/i,
  /changed this group's icon/i,
  /left$/i,
  /changed their phone number/i,
  /security code changed/i,
  /Missed (voice|video) call/i,
  /This message was deleted/i
];

export function parseChatText(
  chatId: string,
  chatText: string,
  _chatName: string,
  ownerNameHint?: string
): { messages: ChatMessage[]; participants: string[] } {
  const rawLines = chatText.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  const participantSet = new Set<string>();

  // Android: "21/10/19, 18:24 - Sender: Message"
  const androidRegex = /^(\d{1,4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[aApP][mM])?)\s+-\s+(?:([^:]+):\s+)?([\s\S]*)$/;

  // iOS: "[21/10/19, 18:24:00] Sender: Message" or "[12/28/24, 3:51:05 PM] Sender: Message"
  const iosRegex = /^\[(\d{1,4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[aApP][mM])?)\]\s+(?:([^:]+):\s+)?([\s\S]*)$/;

  let currentMsg: ChatMessage | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    // Strip invisible formatting characters (LRM \u200e, RLM \u200f, NNBSP \u202f, NBSP \u00a0)
    const cleanLine = rawLines[i]
      .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
      .replace(/[\u202f\u00a0]/g, ' ')
      .trim();

    if (!cleanLine) continue;

    let match = cleanLine.match(androidRegex) || cleanLine.match(iosRegex);

    if (match) {
      if (currentMsg) {
        messages.push(currentMsg);
      }

      const [, dateStr, timeStr, rawSender, textPart] = match;
      const date = parseDateTime(dateStr, timeStr);
      let sender = rawSender ? rawSender.trim().replace(/^~/, '') : '';
      let text = textPart || '';

      let isSystem = false;
      if (!sender) {
        isSystem = true;
        sender = 'System';
      } else if (SYSTEM_PATTERNS.some(p => p.test(cleanLine) || p.test(text))) {
        if (/Missed voice call/i.test(text) || /Missed video call/i.test(text)) {
          // Missed call
        } else if (/This message was deleted/i.test(text)) {
          // Deleted message
        } else {
          isSystem = true;
        }
      }

      if (sender && !isSystem && sender !== 'System') {
        participantSet.add(sender);
      }

      const { attachment, cleanText } = parseAttachment(text);

      const isOutgoing = ownerNameHint
        ? sender.toLowerCase() === ownerNameHint.toLowerCase() || sender.toLowerCase() === 'you'
        : sender.toLowerCase() === 'you';

      currentMsg = {
        id: `${chatId}-${messages.length}-${date.getTime()}`,
        chatId,
        timestamp: date,
        sender,
        isOutgoing,
        text: cleanText,
        isSystem,
        attachment,
        raw: cleanLine
      };
    } else {
      // Continuation of previous message
      if (currentMsg) {
        currentMsg.text += '\n' + cleanLine;
        if (!currentMsg.attachment) {
          const { attachment, cleanText } = parseAttachment(currentMsg.text);
          if (attachment) {
            currentMsg.attachment = attachment;
            currentMsg.text = cleanText;
          }
        }
      }
    }
  }

  if (currentMsg) {
    messages.push(currentMsg);
  }

  return {
    messages,
    participants: Array.from(participantSet)
  };
}
