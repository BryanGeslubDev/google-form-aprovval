const FLOWS = {
  defaultFlow: [
    //ejemplos
    {
      email: "exame@example.cl",
      name: "Example",
      title: "Jefe",
    },
    {
      email: "exame@example.cl",
      name: "Example 2",
      title: "Sub-Jefe",
    },
  ],
  "exampleFlow 1": [
    {
      email: "exame@example.cl",
      name: "Example informatica",
      title: "Developer 1",
    },
    {
      email: "exame@example.cl",
      name: "Example informatica",
      title: "Developer 2",
    },
  ],
  "ExampleFlow 2": [
    {
      email: "exame@example.cl",
      name: "Example informatica",
      title: "Developer 1",
    },
    {
      email: "exame@example.cl",
      name: "Example informatica",
      title: "Developer 2",
    },
  ],
};

function App() {
  this.form = FormApp.getActiveForm();
  this.formUrl = this.form.getPublishedUrl();
  this.url = "URL_IMPLEMENTACIÓN_AQUÍ"; // url de implementación
  this.title = this.form.getTitle();
  this.desription = this.form.getDescription();
  this.sheetname = "Form Responses 1B"; //aquí va el nombre del sheet
  this.flowHeader = "1.1- Gerencia"; // IMPORTANTE - aqui va el nombre del campo que se guiara el flujo
  this.uidHeader = "_uid";
  this.uidPrefix = "UID-";
  this.uidLength = 5;
  this.statusHeader = "_status";
  this.responseIdHeader = "_response_id";
  this.emailHeader = "Dirección de correo electrónico"; // en caso de error, reemplazar por Email Address

  this.pending = "Pending";
  this.approved = "Approved";
  this.rejected = "Rejected";
  this.waiting = "Waiting";

  this.sheet = (() => {
    let sheet;
    try {
      const id = this.form.getDestinationId();
      sheet = SpreadsheetApp.openById(id);
    } catch (e) {
      const id = this.form.getId();
      const file = DriveApp.getFileById(id);
      const parentFolder = file.getParents().next();
      const spreadsheet = SpreadsheetApp.create(this.title + " (Responses)");
      const ssId = spreadsheet.getId();
      this.form.setDestination(FormApp.DestinationType.SPREADSHEET, ssId);
      DriveApp.getFileById(ssId).moveTo(parentFolder);
      sheet = spreadsheet;
    }
    return sheet.getSheetByName(this.sheetname);
  })();

  this.parsedValues = () => {
    const values = this.sheet.getDataRange().getDisplayValues();
    const parsedValues = values.map((value) => {
      return value.map((cell) => {
        try {
          return JSON.parse(cell);
        } catch (e) {
          return cell;
        }
      });
    });
    return parsedValues;
  };

  this.getTaskById = (id) => {
    const values = this.parsedValues();
    const record = values.find((value) =>
      value.some((cell) => cell.taskId === id)
    );
    const row =
      values.findIndex((value) => value.some((cell) => cell.taskId === id)) + 1;

    const headers = values[0];
    const statusColumn = headers.indexOf(this.statusHeader) + 1;
    let task;
    let approver;
    let nextApprover;
    let column;
    let approvers;
    let email;
    let status;
    let responseId;
    if (record) {
      task = record
        .slice(0, headers.indexOf(this.statusHeader) + 1)
        .map((item, i) => {
          return {
            label: headers[i],
            value: item,
          };
        });
      email =
        record[headers.indexOf("Email Address")] ||
        record[headers.indexOf("Dirección de correo electrónico")];

      status = record[headers.indexOf(this.statusHeader)];
      responseId = record[headers.indexOf(this.responseIdHeader)];
      approver = record.find((item) => item.taskId === id);
      column = record.findIndex((item) => item.taskId === id) + 1;
      nextApprover = record[record.findIndex((item) => item.taskId === id) + 1];
      approvers = record.filter((item) => item.taskId);
    }
    return {
      email,
      status,
      responseId,
      task,
      approver,
      nextApprover,
      approvers,
      row,
      column,
      statusColumn,
    };
  };

  this.getResponseById = (id) => {
    const values = this.parsedValues();
    const record = values.find((value) => value.some((cell) => cell === id));
    const headers = values[0];
    let task;
    let approvers;
    let status;
    if (record) {
      task = record
        .slice(0, headers.indexOf(this.statusHeader) + 1)
        .map((item, i) => {
          return {
            label: headers[i],
            value: item,
          };
        });
      status = record[headers.indexOf(this.statusHeader)];
      approvers = record.filter((item) => item.taskId);
    }
    return { task, approvers, status };
  };

  this.createUid = () => {
    const props = PropertiesService.getDocumentProperties();
    let uid = Number(props.getProperty(this.uidHeader));
    if (!uid) uid = 1;

    props.setProperty(this.uidHeader, uid + 1);
    return (
      this.uidPrefix +
      (uid + 10 ** this.uidLength).toString().slice(-this.uidLength)
    );
  };

  this.resetUid = () => {
    const props = PropertiesService.getDocumentProperties();
    props.deleteProperty(this.uidHeader);
  };

  this.sendApproval = ({ task, approver, approvers }) => {
    const template = HtmlService.createTemplateFromFile("approval_email.html");
    template.title = this.title;
    template.task = task;
    template.approver = approver;
    template.approvers = approvers;
    template.actionUrl = `${this.url}?taskId=${approver.taskId}`;
    template.formUrl = this.formUrl;

    template.approved = this.approved;
    template.rejected = this.rejected;
    template.pending = this.pending;
    template.waiting = this.waiting;

    const subject = "Revisión requerida - " + this.title;

    const options = {
      htmlBody: template.evaluate().getContent(),
    };
    GmailApp.sendEmail(approver.email, subject, "", options);
  };

  this.sendNotification = (taskId) => {
    const { email, responseId, status, task, approvers } =
      this.getTaskById(taskId);
    console.log("aqui va el correoooooo", { email, status, task, approvers });
    const template = HtmlService.createTemplateFromFile(
      "notification_email.html"
    );
    const { value: emailAddress } =
      task.find(
        (item) =>
          item.label === "Email Address" ||
          item.label === "Dirección de correo electrónico"
      ) || {};

    template.title = this.title;
    template.task = task;
    template.status = status;
    template.approvers = approvers;
    template.formUrl = this.formUrl;
    template.approvalProgressUrl = `${this.url}?responseId=${responseId}`;

    template.approved = this.approved;
    template.rejected = this.rejected;
    template.pending = this.pending;
    template.waiting = this.waiting;

    const subject = `Approval ${status} - ${this.title}`;

    const options = {
      htmlBody: template.evaluate().getContent(),
    };
    GmailApp.sendEmail(emailAddress, subject, "", options);
  };

  function onEdit(e) {
    const range = e.range;
    const sheet = range.getSheet();
    const column = range.getColumn();
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    const responseColumn = headers.indexOf("_status") + 1;

    if (column === responseColumn) {
      const responseId = sheet
        .getRange(range.getRow(), headers.indexOf("_response_id") + 1)
        .getValue();

      const taskId = getTaskIdByResponseId(responseId);

      if (taskId) {
        const app = new App();
        const { task, approver, approvers } = app.getTaskById(taskId);
        app.sendApproval({ task, approver, approvers });
      }
    }
  }

  function getTaskIdByResponseId(responseId) {
    const values = new App().parsedValues();
    const headers = values[0];
    const responseIdIndex = headers.indexOf("_response_id") + 1;
    const taskIdIndex = headers.indexOf("_approver_1") + 1;

    const row = values.find((value) => value[responseIdIndex] === responseId);
    if (row) {
      return row[taskIdIndex];
    }

    return null;
  }

  this.onFormSubmit = () => {
    const values = this.parsedValues();
    const headers = values[0];
    let lastRow = values.length;
    let startColumn = headers.indexOf(this.uidHeader) + 1;
    if (startColumn === 0) startColumn = headers.length + 1;

    const responses = this.form.getResponses();
    const lastResponse = responses[responses.length - 1];
    const responseId = lastResponse.getId();
    const newHeaders = [
      this.uidHeader,
      this.statusHeader,
      this.responseIdHeader,
    ];
    const newValues = [this.createUid(), this.pending, responseId];

    const flowKey = values[lastRow - 1][headers.indexOf(this.flowHeader)];
    const flow = FLOWS[flowKey] || FLOWS.defaultFlow;
    let taskId;
    flow.forEach((item, i) => {
      newHeaders.push("_approver_" + (i + 1));

      item.comments = null;
      item.taskId = Utilities.base64EncodeWebSafe(Utilities.getUuid());
      item.timestamp = new Date();
      if (i === 0) {
        item.status = this.pending;
        taskId = item.taskId;
      } else {
        item.status = this.waiting;
      }
      if (i !== flow.length - 1) {
        item.hasNext = true;
      } else {
        item.hasNext = false;
      }
      newValues.push(JSON.stringify(item));
    });

    this.sheet
      .getRange(1, startColumn, 1, newHeaders.length)
      .setValues([newHeaders])
      .setBackgroundColor("#34A853")
      .setFontColor("#FFFFFF");

    this.sheet
      .getRange(lastRow, startColumn, 1, newValues.length)
      .setValues([newValues]);

    this.sendNotification(taskId);
    const { task, approver, approvers } = this.getTaskById(taskId);
    this.sendApproval({ task, approver, approvers });
  };

  this.approve = ({ taskId, comments }) => {
    const {
      task,
      approver,
      approvers,
      nextApprover,
      row,
      column,
      statusColumn,
    } = this.getTaskById(taskId);
    if (!approver) return;
    approver.comments = comments;
    approver.status = this.approved;
    approver.timestamp = new Date();
    this.sheet.getRange(row, column).setValue(JSON.stringify(approver));
    if (approver.hasNext) {
      nextApprover.status = this.pending;
      nextApprover.timestamp = new Date();
      this.sheet
        .getRange(row, column + 1)
        .setValue(JSON.stringify(nextApprover));
      this.sendApproval({ task, approver: nextApprover, approvers });
    } else {
      this.sheet.getRange(row, statusColumn).setValue(this.approved);
      this.sendNotification(taskId);
    }
  };

  this.reject = ({ taskId, comments }) => {
    const { task, approver, nextApprover, row, column, statusColumn } =
      this.getTaskById(taskId);
    if (!approver) return;
    approver.comments = comments;
    approver.status = this.rejected;
    approver.timestamp = new Date();
    this.sheet.getRange(row, column).setValue(JSON.stringify(approver));
    this.sheet.getRange(row, statusColumn).setValue(this.rejected);
    this.sendNotification(taskId);
  };
}

function _onFormSubmit() {
  const app = new App();
  app.onFormSubmit();
}

function approve({ taskId, comments }) {
  const app = new App();
  app.approve({ taskId, comments });
}

function reject({ taskId, comments }) {
  const app = new App();
  app.reject({ taskId, comments });
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

function doGet(e) {
  const { taskId, responseId } = e.parameter;
  const app = new App();
  let template;
  if (taskId) {
    template = HtmlService.createTemplateFromFile("index");
    const { task, approver, approvers, status } = app.getTaskById(taskId);
    template.task = task;
    template.status = status;
    template.approver = approver;
    template.approvers = approvers;
    template.url = `${app.url}?taskId=${taskId}`;
  } else if (responseId) {
    template = HtmlService.createTemplateFromFile("approval_progress");
    const { task, approvers, status } = app.getResponseById(responseId);
    template.task = task;
    template.status = status;
    template.approvers = approvers;
  } else {
    template = HtmlService.createTemplateFromFile("404.html");
  }

  template.title = app.title;
  template.pending = app.pending;
  template.approved = app.approved;
  template.rejected = app.rejected;
  template.waiting = app.waiting;

  const htmlOutput = template.evaluate();
  htmlOutput
    .setTitle(app.title)
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return htmlOutput;
}

function resetUid() {
  const app = new App();
  app.resetUid();
}

function createTrigger() {
  const functionName = "_onFormSubmit";
  const triggers = ScriptApp.getProjectTriggers();
  const match = triggers.find(
    (trigger) => trigger.getHandlerFunction() === functionName
  );
  if (match) return;
  return ScriptApp.newTrigger(functionName)
    .forForm(FormApp.getActiveForm())
    .onFormSubmit()
    .create();
}

function onOpen() {
  const trigger = createTrigger();
  const ui = FormApp.getUi();
  const menu = ui.createMenu("Approval");
  menu.addItem("Reset UID", "resetUid");
  menu.addToUi();
}
