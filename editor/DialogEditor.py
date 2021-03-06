from PyQt4 import QtGui, QtCore
import ui_DialogEditor
import json
from ItemEditor import *

class DialogEditor(QtGui.QDialog, ui_DialogEditor.Ui_dialogEditor):
    def __init__(self, main, parent):
        super(DialogEditor, self).__init__(parent)
        self.setupUi(self)
        self.main = main
        self.key = ""
        self.item = None
        self.dialog.itemChanged.connect(self.dialogLineEdited)
        self.dialogs.itemClicked.connect(self.currentDialogChanged)
        self.dialogs.itemChanged.connect(self.currentDialogRenamed)
        QtCore.QObject.connect(self.dialog, QtCore.SIGNAL("currentItemChanged(QTreeWidgetItem *, QTreeWidgetItem *)"), self.currentDialogLineChanged)
        QtCore.QObject.connect(self.events, QtCore.SIGNAL("textEdited(const QString &)"), self.eventsChanged)
        QtCore.QObject.connect(self.avatar, QtCore.SIGNAL("textEdited(const QString &)"), self.avatarChanged)
        QtCore.QObject.connect(self.object, QtCore.SIGNAL("textEdited(const QString &)"), self.objectChanged)
        QtCore.QObject.connect(self.once, QtCore.SIGNAL("stateChanged ( int )"), self.onceChanged)
        QtCore.QObject.connect(self.add, QtCore.SIGNAL('clicked()'), self.addDialog)

        self.dialog.setContextMenuPolicy(QtCore.Qt.ActionsContextMenu)

        action = QtGui.QAction("Add item", self, triggered=self.itemAdded)
        self.dialog.addAction(action)
        action = QtGui.QAction("Remove item", self, triggered=self.itemRemoved)
        self.dialog.addAction(action)

        action = QtGui.QAction("Add filter", self, triggered=self.filterAdded)
        self.filters.addAction(action)
        action = QtGui.QAction("Remove filter", self, triggered=self.filterRemoved)
        self.filters.addAction(action)
        action = QtGui.QAction("", self)
        action.setSeparator(True)
        self.filters.addAction(action)
        action = QtGui.QAction("Choose item", self, triggered=self.filterChooseItem)
        self.filters.addAction(action)

        action = QtGui.QAction("Add action", self, triggered=self.actionAdded)
        self.actions.addAction(action)
        action = QtGui.QAction("Remove action", self, triggered=self.actionRemoved)
        self.actions.addAction(action)
        action = QtGui.QAction("", self)
        action.setSeparator(True)
        self.actions.addAction(action)
        action = QtGui.QAction("Choose item", self, triggered=self.actionChooseItem)
        self.actions.addAction(action)

        self.loadDialogs()
        self.refresh();

    def addDialog(self):
        it = QtGui.QListWidgetItem("New dialog")
        it.setFlags(it.flags() | QtCore.Qt.ItemIsEditable)
        self.dialogs.addItem(it)
        self.data["dialog"]["New dialog"] = {}
        self.data["dialog"]["New dialog"]["events"] = []
        self.data["dialog"]["New dialog"]["face"] = "resources/face0.png"
        self.data["dialog"]["New dialog"]["once"] = False
        self.data["dialog"]["New dialog"]["object"] = ""
        self.data["dialog"]["New dialog"]["dialog"] = {"Question" : "Answer"}

    def createActionItem(self, action = "", arg = ""):
        it = QtGui.QTreeWidgetItem(self.actions)
        it.setFlags(it.flags() | QtCore.Qt.ItemIsEditable)
        it.setText(1, arg)

        comboBox = QtGui.QComboBox()
        comboBox.addItem("add_token")
        comboBox.addItem("add_item")
        comboBox.addItem("add_credit")
        comboBox.addItem("finish_quest")
        comboBox.addItem("restart_quest")
        comboBox.addItem("remove_credit")
        comboBox.addItem("remove_item")
        comboBox.addItem("start_quest")
        comboBox.addItem("spawn_ship_copy")
        comboBox.setCurrentIndex(comboBox.findText(action))
        self.actions.setItemWidget(it, 0, comboBox)

    def createFilterItem(self, action = "", arg = ""):
        it = QtGui.QTreeWidgetItem(self.filters)
        it.setFlags(it.flags() | QtCore.Qt.ItemIsEditable)
        it.setText(1, arg)

        comboBox = QtGui.QComboBox()
        comboBox.addItem("finished_quest")
        comboBox.addItem("has_token")
        comboBox.addItem("has_item")
        comboBox.addItem("has_quest")
        comboBox.addItem("!finished_quest")
        comboBox.addItem("!has_token")
        comboBox.addItem("!has_item")
        comboBox.addItem("!has_quest")
        comboBox.setCurrentIndex(comboBox.findText(action))
        self.filters.setItemWidget(it, 0, comboBox)

    def actionAdded(self):
        self.createActionItem()

    def filterAdded(self):
        self.createFilterItem()

    def actionChooseItem(self):
        it = ItemEditor(self.main, self)
        if it.exec_():
            item = self.actions.currentItem()
            item.setText(1, str(it.index))

    def filterChooseItem(self):
        it = ItemEditor(self.main, self)
        if it.exec_():
            item = self.filters.currentItem()
            item.setText(1, str(it.index))

    def filterRemoved(self):
        self.filters.takeTopLevelItem(self.filters.indexOfTopLevelItem(self.filters.currentItem()))

    def actionRemoved(self):
        self.actions.takeTopLevelItem(self.actions.indexOfTopLevelItem(self.actions.currentItem()))

    def itemAdded(self):
        self.createItem(self.item, "Text")

    def itemRemoved(self):
        if self.item.parent() == None:
            self.dialog.takeTopLevelItem(self.dialog.indexOfTopLevelItem(self.item))
        else:
            self.item.parent().takeChild(self.item.parent().indexOfChild(self.item))
        self.dumpAndSaveDialogs()

    def currentDialogLineChanged(self, item, old):
        if self.item:
            self.dumpActionsFilters()
            self.dumpAndSaveDialogs()
        self.item = item

        self.actions.clear()
        self.filters.clear()

        if not item:
            return

        if item.actions:
            for action in item.actions:
                self.createActionItem(action.split(" ")[0], " ".join(action.split(" ")[1:]))
            self.actions.resizeColumnToContents(0)

        if item.filters:
            for filter in item.filters:
                self.createFilterItem(filter.split(" ")[0], " ".join(filter.split(" ")[1:]))
            self.filters.resizeColumnToContents(0)

    def dumpActionsFilters(self):
        if not self.item:
            return

        self.item.actions = []
        self.item.filters = []

        for i in range(self.actions.topLevelItemCount()):
            item = self.actions.topLevelItem(i)
            self.item.actions.append(unicode(self.actions.itemWidget(item, 0).currentText()) + " " + unicode(item.text(1)))

        for i in range(self.filters.topLevelItemCount()):
            item = self.filters.topLevelItem(i)
            self.item.filters.append(unicode(self.filters.itemWidget(item, 0).currentText()) + " " + unicode(item.text(1)))

        if len(self.item.actions) == 0:
            self.item.actions = None
        if len(self.item.filters) == 0:
            self.item.filters = None

    def refresh(self):
        self.dialog.itemChanged.disconnect(self.dialogLineEdited)
        self.dialogs.clear();
        self.dialog.clear();

        for k, dialog in self.data["dialog"].iteritems():
            it = QtGui.QListWidgetItem(k)
            it.setFlags(it.flags() | QtCore.Qt.ItemIsEditable)
            self.dialogs.addItem(it)
        self.dialog.itemChanged.connect(self.dialogLineEdited)

    def createItem(self, rootItem, text, actions = None, filters = None):
        if rootItem == None:
            rootItem = self.dialog
        it = QtGui.QTreeWidgetItem(rootItem)
        it.setFlags(it.flags() | QtCore.Qt.ItemIsEditable)
        it.setExpanded(True);

        #label = QtGui.QLabel(text)
        #label.setWordWrap(True)
        #self.dialog.setItemWidget(it, 0, label)
        it.setText(0, text)

        if actions:
            it.setText(2, "YES")
            #it.setData(2, QtCore.Qt.UserRole, -1);
        if filters:
            it.setText(1, "YES")
            #it.setText(1, '; '.join(filters))
        it.actions = actions
        it.filters = filters
        return it

    def addItem(self, rootItem, dialog):
        if isinstance(dialog, unicode) or isinstance(dialog, str):
            self.createItem(rootItem, dialog)
            return;
        elif isinstance(dialog, list):
            self.createItem(rootItem, dialog[0], dialog[1:])
            return;
        elif dialog == None:
            return;

        for key, value in dialog.iteritems():
            if key == "filter":
                rootItem.setText(1, "YES")
                rootItem.filters = value
                continue
            it = self.createItem(rootItem, key)
            self.addItem(it, value)

    def eventsChanged(self, text):
        if len(self.key) == 0:
            return
        t = unicode(text);
        self.data["dialog"][self.key]["events"] = t.split(";")
        self.saveDialogs()

    def avatarChanged(self, text):
        if len(self.key) == 0:
            return
        t = unicode(text);
        self.data["dialog"][self.key]["face"] = t
        self.saveDialogs()

    def objectChanged(self, text):
        if len(self.key) == 0:
            return
        t = unicode(text);
        self.data["dialog"][self.key]["object"] = t
        self.saveDialogs()

    def onceChanged(self, state):
        if len(self.key) == 0:
            return
        self.data["dialog"][self.key]["once"] = state == QtCore.Qt.Checked
        self.saveDialogs()

    def currentDialogChanged(self, item):
        self.dialog.itemChanged.disconnect(self.dialogLineEdited)
        key = unicode(item.text())
        self.key = key
        self.item = None
        self.dialog.clear()

        dialog = self.data["dialog"][key]['dialog']
        if not isinstance(dialog, dict):
            self.addItem(None, dialog)
        else:
            for key2 in dialog.keys():
                it = self.createItem(self.dialog, key2)
                self.addItem(it, dialog[key2])

        self.dialog.resizeColumnToContents(0)
        self.dialog.itemChanged.connect(self.dialogLineEdited)

        self.events.setText(";".join(self.data["dialog"][key]["events"]))
        self.avatar.setText(self.data["dialog"][key]["face"])
        if self.data["dialog"][key].has_key("object"):
            self.object.setText(self.data["dialog"][key]["object"])
        else:
            self.object.setText("")
        self.once.setChecked(self.data["dialog"][key]["once"])

    def dumpItem(self, parent):
        # A
        #  - B
        #    -D
        #  - C
        #    - E
        # {A : {B : D, C : E}}
        data = {}
        key = unicode(parent.text(0))
        filters = parent.filters
        actions = parent.actions

        if parent.childCount() == 0:
            if actions != "" and actions != None:
                ret = [key] + actions
                return [x.strip(' ') for x in ret]
            return key
        else:
            data[key] = {}
            for i in range(parent.childCount()):
                child = parent.child(i)
                ret = self.dumpItem(child)
                if isinstance(ret, dict):
                    data[key].update(ret)
                else:
                    if isinstance(data[key], unicode):
                        data[key] = {data[key]: None}
                        if isinstance(ret, unicode):
                            data[key][ret] = None
                        #else:
                            #data[key][ret[0]] = ret[1:]
                    elif isinstance(data[key], list):
                        data[key] = {data[key][0] : data[key][1:]}
                        if isinstance(ret, unicode):
                            data[key][ret] = None
                        #else:
                            #data[key][ret[0]] = ret[1:]
                    elif isinstance(ret, unicode):
                        data[key][ret] = None
                    else:
                        print data[key], ret
                        data[key] = ret
            if isinstance(data[key], dict) and filters != "" and filters != None:
                data[key]["filter"] = [x.strip(' ') for x in filters]
            return data

    def dialogLineEdited(self, item):
        print "dialog line edited"
        self.dumpActionsFilters()
        self.dumpAndSaveDialogs()

    def currentDialogRenamed(self, item):
        key = unicode(item.text())
        self.data["dialog"][key] = self.data["dialog"][self.key]
        del self.data["dialog"][self.key]
        self.key = key
        self.saveDialogs()

    def loadDialogs(self):
        f = open("../resources/dialogs.json")
        self.data = json.load(f)
        f.close()

    def dumpAndSaveDialogs(self):
        dialog = {}

        for i in range(self.dialog.topLevelItemCount()):
            item = self.dialog.topLevelItem(i)
            x = self.dumpItem(item)
            if isinstance(dialog, unicode):
                d = {}
                d[dialog] = {}
                dialog = d
            elif isinstance(dialog, list):
                d = {}
                d[dialog[0]] = d[1:]
                dialog = d
            if isinstance(x, dict):
                dialog.update(x)
            else:
                dialog = x
    
        self.data["dialog"][self.key]['dialog'] = dialog
        self.saveDialogs()

    def saveDialogs(self):
        f = open("../resources/dialogs.json", "w")
        f.write(json.dumps(self.data))
        f.close()
