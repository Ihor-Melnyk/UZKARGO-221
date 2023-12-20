function setPropertyRequired(attributeName, boolValue = true) {
  //обов"язкове
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.required = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setPropertyHidden(attributeName, boolValue = true) {
  //приховане
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.hidden = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setPropertyDisabled(attributeName, boolValue = true) {
  //недоступне
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.disabled = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

//Скрипт 1. Зміна властивостей атрибутів при створені документа
function onCreate() {
  setContractorRPEmailOnCreate();
  setBranchAndSectionsOnCreate();
}

function setCreateProps() {
  if (CurrentDocument.inExtId) {
    setPropertyRequired("Subject");
    setPropertyRequired("Branch");
    setPropertyRequired("RegNumber");
    setPropertyRequired("RegDate");
    setPropertyRequired("Registraion");
  }
}

//Скрипт 2. Зміна властивостей атрибутів після виконання завдання
function onCardInitialize() {
  SendOutDocTask();
  ToDoPaymentOptionTask();
  ReceiptFundsTask();
  EnterActResultTask();
  setPropOnAddEmployeeTaskOrInformHeadTask();
  setCreateProps();
}

function SendOutDocTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("SendOutDoc").state;
  if (stateTask == "completed") {
    setPropertyDisabled("Subject");
    setPropertyDisabled("TelephoneContactPerson");
    setPropertyDisabled("Branch");
    setPropertyDisabled("RegNumber");
    setPropertyDisabled("RegDate");
    setPropertyDisabled("Registraion");
  } else {
    setPropertyDisabled("Subject", false);
    setPropertyDisabled("TelephoneContactPerson", false);
    setPropertyDisabled("RegNumber", false);
    setPropertyDisabled("RegDate", false);
    setPropertyDisabled("Registraion", false);
  }
}

//Скрипт 4. Автоматичне визначення email контактної особи Замовника
function setContractorRPEmailOnCreate() {
  if (CurrentDocument.inExtId) {
    var atr = EdocsApi.getInExtAttributes(CurrentDocument.id.toString())?.tableAttributes;
    if (atr)
      EdocsApi.setAttributeValue({
        code: "ContractorRPEmail",
        value: EdocsApi.findElementByProperty("code", "ContactPersonEmail", atr)?.value,
        text: null,
      });
  }
}

function sendCommand(routeStage) {
  debugger;
  var command;
  var comment;
  if (routeStage.executionResult == "executed") {
    command = "CompleteTask";
  } else {
    command = "RejectTask";
    comment = routeStage.comment;
  }
  var signatures = EdocsApi.getSignaturesAllFiles();
  var DocCommandData = {
    extSysDocID: CurrentDocument.id,
    extSysDocVersion: CurrentDocument.version,
    command: command,
    legalEntityCode: EdocsApi.getAttributeValue("HomeOrgEDRPOU").value,
    userEmail: EdocsApi.getEmployeeDataByEmployeeID(CurrentUser.employeeId).email,
    userTitle: CurrentUser.fullName,
    comment: comment,
    signatures: signatures,
  };

  routeStage.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processDocCommand", // метод зовнішньої системи
    data: DocCommandData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: false, // виконувати завдання асинхронно
  };
}

function sendComment(comment) {
  debugger;
  var HomeOrgEDRPOU = EdocsApi.getAttributeValue("HomeOrgEDRPOU").value;
  var HomeOrgName = EdocsApi.getAttributeValue("HomeOrgName").value;
  if (!HomeOrgEDRPOU || !HomeOrgName) {
    return;
  }
  //var comment = comment;
  var methodData = {
    extSysDocId: CurrentDocument.id,
    ExtSysDocVersion: CurrentDocument.version,
    eventType: "CommentAdded",
    comment: comment,
    partyCode: HomeOrgEDRPOU,
    userTitle: CurrentUser.name,
    partyName: HomeOrgName,
    occuredAt: new Date(),
  };
  EdocsApi.runExternalFunction("ESIGN1", "integration/processEvent", methodData);
}

//Скрипт 6. Зміна властивостей атрибутів
function onTaskExecutedSendOutDoc(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    ToDoPaymentOption();
  }
}

function ToDoPaymentOptionTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("ToDoPaymentOption" + EdocsApi.getAttributeValue("Sections").value)?.state;

  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    setPropertyRequired("PaymentOption");
    setPropertyHidden("PaymentOption", false);
    setPropertyDisabled("PaymentOption", false);
  } else if (stateTask == "completed") {
    setPropertyRequired("PaymentOption");
    setPropertyHidden("PaymentOption", false);
    setPropertyDisabled("PaymentOption");
  } else {
    setPropertyRequired("PaymentOption", false);
    setPropertyHidden("PaymentOption");
    setPropertyDisabled("PaymentOption", false);
  }
}

function onTaskExecuteToDoPaymentOption(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("ResultMeeting").value) throw `Внесіть значення в поле  "Спосіб отримання коштів від Замовника"`;
  }
}

//Скрипт 7. Зміна властивостей атрибутів
function ReceiptFundsTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("ReceiptFunds" + EdocsApi.getAttributeValue("Sections").value)?.state;

  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    setPropertyRequired("StatusInvoice");
    setPropertyHidden("StatusInvoice", false);
    setPropertyDisabled("StatusInvoice", false);

    //sendComment("Звернення на видачу ТУ погоджене. Очікуйте інформацію щодо подальших дій.");
  } else if (stateTask == "completed") {
    setPropertyRequired("StatusInvoice");
    setPropertyHidden("StatusInvoice", false);
    setPropertyDisabled("StatusInvoice");
  } else {
    setPropertyRequired("StatusInvoice", false);
    setPropertyHidden("StatusInvoice");
    setPropertyDisabled("StatusInvoice", false);
  }
}

function onTaskExecuteReceiptFunds(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("StatusInvoice").value) throw `Внесіть значення в поле "Статус оплати Замовником"`;
  }
}

//Скрипт 8. Зміна властивостей атрибутів
function EnterActResultTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("EnterActResult" + EdocsApi.getAttributeValue("Sections").value)?.state;

  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    setPropertyRequired("ActMeetingResult");
    setPropertyHidden("ActMeetingResult", false);
    setPropertyDisabled("ActMeetingResult", false);
  } else if (stateTask == "completed") {
    setPropertyRequired("ActMeetingResult");
    setPropertyHidden("ActMeetingResult", false);
    setPropertyDisabled("ActMeetingResult");
  } else {
    setPropertyRequired("ActMeetingResult", false);
    setPropertyHidden("ActMeetingResult");
    setPropertyDisabled("ActMeetingResult", false);
  }
}

function onTaskExecuteEnterActResult(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("ActMeetingResult").value) throw `Внесіть значення в поле "Результат розгляду акту комісією"`;
  }
}

//Автоматичне визначення розрізу за кодом ЄДРПОУ
function setBranchAndSectionsOnCreate() {
  debugger;
  if (CurrentDocument.inExtId) {
    var atr = EdocsApi.getInExtAttributes(CurrentDocument.id.toString())?.tableAttributes;
    if (atr)
      switch (atr.find((x) => x.code == "LegalEntityCode" && x.row == "1")?.value) {
        case "40081195":
          EdocsApi.setAttributeValue({
            code: "Branch",
            value: 82,
            text: null,
          });
          EdocsApi.setAttributeValue({
            code: "Sections",
            value: "40081195",
            text: null,
          });
          break;

        case "40081216":
          EdocsApi.setAttributeValue({
            code: "Branch",
            value: 86,
            text: null,
          });
          EdocsApi.setAttributeValue({
            code: "Sections",
            value: "40081216",
            text: null,
          });
          break;

        case "40081237":
          EdocsApi.setAttributeValue({
            code: "Branch",
            value: 252,
            text: null,
          });
          EdocsApi.setAttributeValue({
            code: "Sections",
            value: "40081237",
            text: null,
          });

          break;

        default:
          break;
      }
  }
}

//Скрипт 2. Зміна властивостей при призначенні завдання
function onTaskExecutedAddEmployee(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    SendOutDocTask();
  }
}
function SendOutDocTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("SendOutDoc")?.state;
  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    // setPropertyRequired("TelephoneContactPerson");
    setPropertyHidden("TelephoneContactPerson", false);
    setPropertyDisabled("TelephoneContactPerson", false);
    setPropertyRequired("Subject");
    setPropertyHidden("Subject", false);
    setPropertyDisabled("Subject", false);
    setPropertyRequired("RegNumber");
    setPropertyHidden("RegNumber", false);
    setPropertyDisabled("RegNumber", false);
    setPropertyRequired("RegDate");
    setPropertyHidden("RegDate", false);
    setPropertyDisabled("RegDate", false);
    setPropertyRequired("Registraion");
    setPropertyHidden("Registraion", false);
    setPropertyDisabled("Registraion", false);
  } else if (stateTask == "completed") {
    // setPropertyRequired("TelephoneContactPerson");
    setPropertyHidden("TelephoneContactPerson", false);
    setPropertyDisabled("TelephoneContactPerson");
    setPropertyRequired("Subject");
    setPropertyHidden("Subject", false);
    setPropertyDisabled("Subject");
    setPropertyRequired("RegNumber");
    setPropertyHidden("RegNumber", false);
    setPropertyDisabled("RegNumber");
    setPropertyRequired("RegDate");
    setPropertyHidden("RegDate", false);
    setPropertyDisabled("RegDate");
    setPropertyRequired("Registraion");
    setPropertyHidden("Registraion", false);
    setPropertyDisabled("Registraion");
  } else {
    setPropertyRequired("TelephoneContactPerson", false);
    setPropertyHidden("TelephoneContactPerson");
    setPropertyDisabled("TelephoneContactPerson", false);
    setPropertyDisabled("Subject", false);
    setPropertyRequired("Subject", false);
    setPropertyHidden("Subject");
    setPropertyRequired("RegNumber", false);
    setPropertyHidden("RegNumber");
    setPropertyDisabled("RegNumber", false);
    setPropertyRequired("RegDate", false);
    setPropertyHidden("RegDate");
    setPropertyDisabled("RegDate", false);
    setPropertyRequired("Registraion", false);
    setPropertyHidden("Registraion");
    setPropertyDisabled("Registraion", false);
  }
}

function onTaskExecuteSendOutDoc(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("RegNumber").value) throw `Не заповнено значення поля "Реєстраційний номер"`;
    if (!EdocsApi.getAttributeValue("RegDate").value) throw `Не заповнено значення поля "Реєстраційна дата"`;
    if (!EdocsApi.getAttributeValue("Registraion").value) throw `Не заповнено значення поля "Реєстрація"`;
    sendComment(`Ваше звернення прийняте та зареєстроване за № ${EdocsApi.getAttributeValue("RegNumber").value} від ${moment(new Date(EdocsApi.getAttributeValue("RegDate").value)).format("DD.MM.YYYY")}`);
  }
}

function onTaskExecuteMainTask(routeStage) {
  if (routeStage.executionResult == "rejected") {
    sendCommand(routeStage);
  }
}

//передача коментара в єСайн, додаткових функцій не потрібно
function onTaskCommentedSendOutDoc(caseTaskComment) {
  debugger;
  var orgCode = EdocsApi.getAttributeValue("HomeOrgEDRPOU").value;
  var orgShortName = EdocsApi.getAttributeValue("HomeOrgName").value;
  if (!orgCode || !orgShortName) {
    return;
  }
  var idnumber = CurrentDocument.id;
  //EdocsApi.getAttributeValue("DocId");
  var methodData = {
    extSysDocId: idnumber,
    eventType: "CommentAdded",
    comment: caseTaskComment.comment,
    partyCode: orgCode,
    userTitle: CurrentUser.name,
    partyName: orgShortName,
    occuredAt: new Date(),
  };

  caseTaskComment.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processEvent", // метод зовнішньої системи
    data: methodData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: true, // виконувати завдання асинхронно
  };
}

//зміна властивостей при паралельних процесах
//Скрипт 1. Зміна властивостей атрибутів полів карточки
function onTaskPickUpedAddEmployee() {
  setPropOnAddEmployeeTaskOrInformHeadTask();
}

function onTaskPickUpedInformHead() {
  setPropOnAddEmployeeTaskOrInformHeadTask();
}

function setPropOnAddEmployeeTaskOrInformHeadTask() {
  debugger;
  var CaseTaskAddEmployee = EdocsApi.getCaseTaskDataByCode("AddEmployee" + EdocsApi.getAttributeValue("Sections").value);
  var CaseTaskInformHead = EdocsApi.getCaseTaskDataByCode("InformHead" + EdocsApi.getAttributeValue("Sections").value);

  //етап AddEmployee взято в роботу, поточний користувач = виконавець завдання AddEmployee
  if ((CaseTaskAddEmployee.state == "assigned" && CurrentUser.employeeId == CaseTaskAddEmployee.executorId) || (CaseTaskAddEmployee.state == "inProgress" && CurrentUser.employeeId == CaseTaskAddEmployee.executorId) || (CaseTaskAddEmployee.state == "delegated" && CurrentUser.employeeId == CaseTaskAddEmployee.executorId)) {
    setPropertyRequired("Responsible");
    setPropertyDisabled("Responsible", false);
  } else if (
    //етап InformHead взято в роботу, поточний користувач = виконавець завдання InformHead
    (CaseTaskInformHead.state == "assigned" && CurrentUser.employeeId == CaseTaskInformHead.executorId) ||
    (CaseTaskInformHead.state == "inProgress" && CurrentUser.employeeId == CaseTaskInformHead.executorId) ||
    (CaseTaskInformHead.state == "delegated" && CurrentUser.employeeId == CaseTaskInformHead.executorId)
  ) {
    setPropertyRequired("Responsible", false);
    setPropertyDisabled("Responsible", false);
  } else if (CaseTaskAddEmployee.state == "completed" || CaseTaskInformHead.state == "completed") {
    setPropertyRequired("Responsible");
    setPropertyDisabled("Responsible");
  } else {
    setPropertyRequired("Responsible", false);
    setPropertyDisabled("Responsible", false);
  }
}

function onTaskExecuteAddEmployee(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("Responsible").value) throw `Внесіть значення в поле "Відповідальний працівник"`;
  }
}
