<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Инцидент №12345</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(90deg,#0b0f2f,#1a2b6d); padding:20px; color:#ffffff;">
              
              <!-- ЛОГОТИП (фиксированный размер) -->
              <!-- ЗАМЕНИ src НА СВОЙ -->
              <img 
                src="https://via.placeholder.com/120x40?text=LOGO" 
                width="120" 
                height="40"
                alt="Logo" 
                style="display:block; width:120px; height:40px; margin-bottom:10px; border:0;">
              
              <h1 style="margin:0; font-size:22px;">Инцидент №12345 — нарушение SLA сервиса X</h1>
            </td>
          </tr>

          <!-- ВСТУПЛЕНИЕ -->
          <tr>
            <td style="padding:20px; color:#333333; font-size:14px; line-height:1.5;">
              <p style="margin:0 0 10px 0;">Здравствуйте!</p>
              <p style="margin:0;">
                Зафиксировано нарушение SLA по сервису <b>X</b>. Ниже представлена краткая информация по инциденту.
              </p>
            </td>
          </tr>

          <!-- КАРТОЧКА -->
          <tr>
            <td style="padding:0 20px 20px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9; border-radius:8px;">
                <tr>
                  <td style="padding:15px;">
                    <h2 style="margin:0 0 10px 0; font-size:16px; color:#1a2b6d;">Детали инцидента</h2>

                    <p style="margin:0 0 8px 0; font-size:14px;"><b>Сервис:</b> X</p>
                    <p style="margin:0 0 8px 0; font-size:14px;"><b>Время:</b> 10:45</p>
                    <p style="margin:0 0 8px 0; font-size:14px;"><b>Статус:</b> В работе</p>
                    <p style="margin:0; font-size:14px;"><b>Ответственный:</b> IT Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- КНОПКА -->
          <tr>
            <td align="center" style="padding:10px 20px 30px 20px;">
              <a href="#" 
                 style="background-color:#4c5cff; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:6px; display:inline-block; font-size:14px;">
                Подробнее
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#eeeeee; padding:15px; text-align:center; font-size:12px; color:#777777;">
              Это автоматическое уведомление. Не отвечайте на письмо.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

  <!--
    ВАЖНО:
    width + height в атрибутах = обязательно для Outlook
    style width/height = для современных клиентов
    НЕ используйте max-width для логотипа в email
  -->

</body>
</html>
