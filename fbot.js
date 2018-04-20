// Chargement de la librairie discord.js
const Discord = require("discord.js")

//require("node-opus");
require("opusscript");
require("opusscript");
require ("node-opus")
const snekfetch = require('snekfetch');
const ytdl = require('ytdl-core');
// Ici utilisation de 'bot' plutôt que 'client' mais penser à changer les fragments de code en fonction.
const bot = new Discord.Client();
//Pour modifier la config
const fs = require("fs")
// Pour le jeton (token) et le prefix du bot, fichier config à part.
const config = require("./config.json");



bot.on("ready", () => {
  // Au démarrage réussi du bot.
  console.log("C'est parti !"); 
  // Attention utilisation de bot.user plutôt que de client.user
  bot.user.setStatus("online");
  bot.user.setActivity("1984 : Aide Big Eagle.");
});

bot.on("guildCreate", guild => {
  // Rejoindre un serveur.
  console.log(`Nouveau serveur observé : ${guild.name} (id: ${guild.id}). Population sous surveillance : ${guild.memberCount} membres !`);
});

bot.on("guildDelete", guild => {
  // Quitter un serveur.
  console.log(`Expulsion des locaux : ${guild.name} (id: ${guild.id})`);
});

bot.on('guildMemberAdd', member => {
  //Bienvenue
  member.createDM().then(channel => {
    return channel.send("Bienvenue sur l'un des serveurs du Journal communautaire d'Elvenar France, "+ member.displayName + "! Merci de l'avoir rejoint. Pour toute question, adressez-vous au rédacteur en chef (Thorondhor#1811) qui vous répondra le plus rapidement possible. " )
  }).catch(console.error);
  // On pourrait catch l'erreur autrement ici (l'utilisateur a peut être désactivé les MP)
  
})

bot.on("message", async message => {
  // Pour tout message reçu (MP compris)
    // Ignorer les messages de bots (lui compris)
  //éviter ce qu'on appelle "botception".
  if(message.author.bot) return;
  
  // Ignorer les messages ne commençant pas par le prefix
  // défini dans le fichier config.
  if(message.content.indexOf(config.prefix) !== 0) return;
  
  // séparer avec split le nom de la commande et les arguments
  // i.e. avec le message "+say Big Eagle is watching YOU" , on aura :
  // command = say
  // args = ["Big", "Eagle", "is", "watching", "YOU"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  // Les p'tits tests.
  
  if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping ? Big Eagle is watching YOU.");
    m.edit(`Pong ! La latence est de ${m.createdTimestamp - message.createdTimestamp}ms. La latence de l'API est de ${Math.round(bot.ping)}ms`);
  }
  
  if(command === "say") {
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }

  // La config
  if(command === "prefix") {
    message.delete().catch(O_o=>{}); 
    // séparation commande et nouveau préfixe
    let newPrefix = message.content.split(" ").slice(1, 2)[0];
    // changement de la config
    config.prefix = newPrefix;
  
    // sauvegarde de la config
    fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);

    //confirmation
    message.reply("Préfixe modifé en "+newPrefix+" avec succès.");
  }

  ////La modération
  if(command === "kick") {
      message.delete().catch(O_o=>{}); 
    // This command must be limited to mods and admins. In this example we just hardcode the role names.
    // Please read on Array.some() to understand this bit: 
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
    if(!message.member.roles.some(r=>["Administrateur", "Rédacteur en chef", "Rédacteur en chef adjoint","Super observateur de l'équipe"].includes(r.name)) )
      return message.reply("expulsion impossible. Vous n'avez pas obtenu la permission de Big Eagle.");
    
    // Let's first check if we have a member and if we can kick them!
    // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
    // We can also support getting the member by ID, which would be args[0]
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!member)
      return message.reply("donnez le nom de la personne à expulser.");
    if(!member.kickable) 
      return message.reply("expulsion impossible. Cet utilisateur est sous la protection de Big Eagle.");
    
    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if(!reason) reason = "pas de pièce justificative.";
    
    // Now, time for a swift kick in the nuts!
    await member.kick(reason)
      .catch(error => message.reply("expulsion impossible. Désolé ${message.author}, vous ne pouvez pas l'expulser. Raison : ${error}"));
    message.reply(`${member.user.tag} a été expulsé avec succès par ${message.author.tag} pour le motif suivant : ${reason}`);

  }

  
  if(command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    // In the real world mods could ban too, but this is just an example, right? ;)

    message.delete().catch(O_o=>{}); 

    if(!message.member.roles.some(r=>["Administrateur", "Rédacteur en chef", "Rédacteur en chef adjoint", "Super observateur de l'équipe"].includes(r.name)) )
      return message.reply("ban impossible, vous n'avez pas obtenu la permission de Big Eagle.");
    
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("donnez le nom de la personne à bannir.");
    if(!member.bannable) 
      return message.reply("impossible de bannir cet utilisateur. Il est sous la protection de Big Eagle. Envoyez-lui une requête.");

    let reason = args.slice(1).join(' ');
    if(!reason) reason = "pas de pièce justificative.";
    
    await member.ban(reason)
      .catch(error => message.reply("ban impossible. Désolé ${message.author} il m'est impossible de faire éxécuter l'ordre de bannissement. Motif 1 : mon marteau est cassé. Motif 2 : ${error}"));
    message.reply(`${member.user.tag} a été banni par ${message.author.tag}. Motif : ${reason}`);
  }

  
  //aspi-buuug
   if (command ==="aspi") {
    //copie code purge original
    if(!message.member.roles.some(r=>["Administrateur", "Rédacteur en chef", "Super observateur de l'équipe"].includes(r.name)) )
    return message.reply("réponse négative. Permission refusée.");

      // We want to check if the argument is a number
      if (isNaN(args[0])) {
          // Sends a message to the channel.
          return message.reply(`Indiquez le nombre de messages à supprimer. \n Utilisez : ${config.prefix} aspi <nombre>`); //\n means new line.
} 
let fetched = await message.channel.fetchMessages({limit: args[0]});
if(!fetched) 
return message.reply("erreur en tenant de passer l'aspirateur...");
console.log(fetched.size + ' messages trouvés, suppression...'); // Lets post into console how many messages we are deleting
message.channel.bulkDelete (fetched)
message.reply(`Aspirateur passé avec succès. \n Total des messages supprimés (dont la commande): ${fetched.size}`)
  
}

  });
  
    ////Fonctionalités pour le fun (à venir)
    
  

bot.login(config.token);
